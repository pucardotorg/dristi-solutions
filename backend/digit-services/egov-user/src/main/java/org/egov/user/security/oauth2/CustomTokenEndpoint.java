package org.egov.user.security.oauth2;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.user.domain.exception.DuplicateUserNameException;
import org.egov.user.domain.exception.UserNotFoundException;
import org.egov.user.domain.model.SecureUser;
import org.egov.user.domain.model.User;
import org.egov.user.domain.model.enums.UserType;
import org.egov.user.domain.service.UserService;
import org.egov.user.domain.service.utils.EncryptionDecryptionUtil;
import org.egov.user.security.oauth2.custom.CustomAuthenticationManager;
import org.egov.user.web.contract.auth.Role;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Custom OAuth2-compatible token endpoint.
 * Replaces the deprecated spring-security-oauth2 @EnableAuthorizationServer.
 * Handles grant_type=password and grant_type=refresh_token.
 * Maintains backward-compatible request/response format for all clients.
 */
@RestController
@RequestMapping("/oauth/token")
@Slf4j
public class CustomTokenEndpoint {

    private final CustomAuthenticationManager authenticationManager;
    private final EgovTokenStore tokenStore;

    @Autowired
    private UserService userService;

    @Autowired
    private EncryptionDecryptionUtil encryptionDecryptionUtil;

    @Value("${access.token.validity.in.minutes}")
    private int accessTokenValidityMinutes;

    @Value("${refresh.token.validity.in.minutes}")
    private int refreshTokenValidityMinutes;

    @Value("${refresh.token.reuse:true}")
    private boolean reuseRefreshToken;

    public CustomTokenEndpoint(CustomAuthenticationManager authenticationManager,
                               EgovTokenStore tokenStore) {
        this.authenticationManager = authenticationManager;
        this.tokenStore = tokenStore;
    }

    @PostMapping(consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public Map<String, Object> token(
            @RequestParam("grant_type") String grantType,
            @RequestParam(value = "username", required = false) String username,
            @RequestParam(value = "password", required = false) String password,
            @RequestParam(value = "scope", defaultValue = "read") String scope,
            @RequestParam(value = "tenantId", required = false) String tenantId,
            @RequestParam(value = "userType", required = false) String userType,
            @RequestParam(value = "refresh_token", required = false) String refreshToken,
            @RequestParam(value = "isInternal", required = false) String isInternal) {

        Authentication authenticated;

        String existingRefreshToken = null;

        if ("password".equals(grantType)) {
            authenticated = authenticatePassword(username, password, tenantId, userType, isInternal);
        } else if ("refresh_token".equals(grantType)) {
            authenticated = refreshTokenAuthentication(refreshToken, tenantId, userType);
            existingRefreshToken = refreshToken; // For reuse
        } else {
            throw new BadCredentialsException("Unsupported grant_type: " + grantType);
        }

        return issueTokenResponse(authenticated, scope, existingRefreshToken);
    }

    private Authentication authenticatePassword(String username, String password,
                                                String tenantId, String userType, String isInternal) {
        LinkedHashMap<String, String> details = new LinkedHashMap<>();
        if (tenantId != null) details.put("tenantId", tenantId);
        if (userType != null) details.put("userType", userType);
        if (isInternal != null) details.put("isInternal", isInternal);

        UsernamePasswordAuthenticationToken token =
                new UsernamePasswordAuthenticationToken(username, password);
        token.setDetails(details);

        try {
            return authenticationManager.authenticate(token);
        } catch (AuthenticationException e) {
            log.error("Authentication failed for user: {}", username, e);
            throw e;
        }
    }

    /**
     * Re-authenticates user during refresh_token flow.
     * This mirrors the old Spring OAuth2 behavior where CustomPreAuthenticatedProvider
     * was invoked to fetch fresh user data and validate account status.
     */
    private Authentication refreshTokenAuthentication(String refreshToken, String tenantId, String userType) {
        if (refreshToken == null) {
            throw new BadCredentialsException("refresh_token is required");
        }

        // Step 1: Read stored authentication from Redis
        Authentication storedAuth = tokenStore.readAuthenticationFromRefreshToken(refreshToken);
        if (storedAuth == null) {
            throw new BadCredentialsException("Invalid or expired refresh_token");
        }

        // Step 2: Extract user details from stored authentication
        SecureUser storedSecureUser = (SecureUser) storedAuth.getPrincipal();
        String userName = storedSecureUser.getUsername();

        // Use tenantId from request if provided, otherwise fall back to stored value
        String effectiveTenantId = StringUtils.hasText(tenantId) ? tenantId : storedSecureUser.getTenantId();
        String effectiveUserType = StringUtils.hasText(userType) ? userType : storedSecureUser.getUser().getType();

        // Validate required fields
        if (!StringUtils.hasText(effectiveTenantId)) {
            throw new BadCredentialsException("TenantId is mandatory");
        }
        if (!StringUtils.hasText(effectiveUserType) || UserType.fromValue(effectiveUserType) == null) {
            throw new BadCredentialsException("User Type is mandatory and has to be a valid type");
        }

        // Step 3: Fetch fresh user data from database (mirrors CustomPreAuthenticatedProvider)
        User user;
        try {
            user = userService.getUniqueUser(userName, effectiveTenantId, UserType.fromValue(effectiveUserType));

            // Decrypt user data
            Set<org.egov.user.domain.model.Role> domain_roles = user.getRoles();
            List<org.egov.common.contract.request.Role> contract_roles = new ArrayList<>();
            for (org.egov.user.domain.model.Role role : domain_roles) {
                contract_roles.add(org.egov.common.contract.request.Role.builder()
                        .code(role.getCode()).name(role.getName()).build());
            }
            org.egov.common.contract.request.User userInfo = org.egov.common.contract.request.User.builder()
                    .uuid(user.getUuid())
                    .type(user.getType() != null ? user.getType().name() : null)
                    .roles(contract_roles).build();
            RequestInfo requestInfo = RequestInfo.builder().userInfo(userInfo).build();
            user = encryptionDecryptionUtil.decryptObject(user, "UserSelf", User.class, requestInfo);

        } catch (UserNotFoundException e) {
            log.error("User not found during refresh_token", e);
            throw new BadCredentialsException("Invalid login credentials");
        } catch (DuplicateUserNameException e) {
            log.error("Fatal error, user conflict, more than one user found", e);
            throw new BadCredentialsException("Invalid login credentials");
        }

        // Step 4: Validate account is active
        if (user.getActive() == null || !user.getActive()) {
            throw new DisabledException("Please activate your account");
        }

        // Step 5: Validate account is not locked
        if (user.getAccountLocked() != null && user.getAccountLocked()) {
            throw new LockedException("Account locked");
        }

        // Step 6: Build fresh authentication with updated user data
        List<GrantedAuthority> grantedAuths = new ArrayList<>();
        grantedAuths.add(new SimpleGrantedAuthority("ROLE_" + user.getType()));
        final SecureUser freshSecureUser = new SecureUser(buildAuthUser(user));

        return new UsernamePasswordAuthenticationToken(freshSecureUser, null, grantedAuths);
    }

    /**
     * Builds auth User from domain User (mirrors CustomPreAuthenticatedProvider.getUser)
     */
    private org.egov.user.web.contract.auth.User buildAuthUser(User user) {
        org.egov.user.web.contract.auth.User authUser = org.egov.user.web.contract.auth.User.builder()
                .id(user.getId())
                .userName(user.getUsername())
                .uuid(user.getUuid())
                .name(user.getName())
                .mobileNumber(user.getMobileNumber())
                .emailId(user.getEmailId())
                .locale(user.getLocale())
                .active(user.getActive())
                .type(user.getType().name())
                .roles(toAuthRole(user.getRoles()))
                .tenantId(user.getTenantId())
                .build();

        if (user.getPermanentAddress() != null) {
            authUser.setPermanentCity(user.getPermanentAddress().getCity());
        }

        return authUser;
    }

    private Set<Role> toAuthRole(Set<org.egov.user.domain.model.Role> domainRoles) {
        if (domainRoles == null)
            return new HashSet<>();
        return domainRoles.stream().map(Role::new).collect(Collectors.toSet());
    }

    private Map<String, Object> issueTokenResponse(Authentication authentication, String scope, 
                                                     String existingRefreshToken) {
        String accessToken = UUID.randomUUID().toString();
        
        // Reuse existing refresh token if configured (matches old setReuseRefreshToken(true))
        String refreshTokenToReturn;
        if (reuseRefreshToken && existingRefreshToken != null) {
            refreshTokenToReturn = existingRefreshToken;
            // Don't remove or regenerate - just reuse existing
        } else {
            refreshTokenToReturn = UUID.randomUUID().toString();
            // Remove old refresh token if not reusing
            if (existingRefreshToken != null) {
                tokenStore.removeRefreshToken(existingRefreshToken);
            }
        }

        long accessExpirySeconds = (long) accessTokenValidityMinutes * 60;
        long refreshExpirySeconds = (long) refreshTokenValidityMinutes * 60;

        tokenStore.storeAccessToken(accessToken, authentication, accessExpirySeconds);
        
        // Only store new refresh token if not reusing existing one
        if (!reuseRefreshToken || existingRefreshToken == null) {
            tokenStore.storeRefreshToken(refreshTokenToReturn, authentication, refreshExpirySeconds);
        }

        SecureUser secureUser = (SecureUser) authentication.getPrincipal();

        Map<String, Object> responseInfo = new LinkedHashMap<>();
        responseInfo.put("api_id", "");
        responseInfo.put("ver", "");
        responseInfo.put("ts", "");
        responseInfo.put("res_msg_id", "");
        responseInfo.put("msg_id", "");
        responseInfo.put("status", "Access Token generated successfully");

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("access_token", accessToken);
        response.put("token_type", "bearer");
        response.put("refresh_token", refreshTokenToReturn);
        response.put("expires_in", accessExpirySeconds);
        response.put("scope", scope);
        response.put("ResponseInfo", responseInfo);
        response.put("UserRequest", secureUser.getUser());

        return response;
    }
}
