package org.egov.user.security.oauth2;

import lombok.extern.slf4j.Slf4j;
import org.egov.user.domain.model.SecureUser;
import org.egov.user.security.oauth2.custom.CustomAuthenticationManager;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

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

    @Value("${access.token.validity.in.minutes}")
    private int accessTokenValidityMinutes;

    @Value("${refresh.token.validity.in.minutes}")
    private int refreshTokenValidityMinutes;

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

        if ("password".equals(grantType)) {
            authenticated = authenticatePassword(username, password, tenantId, userType, isInternal);
        } else if ("refresh_token".equals(grantType)) {
            authenticated = refreshToken(refreshToken);
        } else {
            throw new BadCredentialsException("Unsupported grant_type: " + grantType);
        }

        return issueTokenResponse(authenticated, scope);
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

    private Authentication refreshToken(String refreshToken) {
        if (refreshToken == null) {
            throw new BadCredentialsException("refresh_token is required");
        }
        Authentication auth = tokenStore.readAuthenticationFromRefreshToken(refreshToken);
        if (auth == null) {
            throw new BadCredentialsException("Invalid or expired refresh_token");
        }
        tokenStore.removeRefreshToken(refreshToken);
        return auth;
    }

    private Map<String, Object> issueTokenResponse(Authentication authentication, String scope) {
        String accessToken = UUID.randomUUID().toString();
        String refreshToken = UUID.randomUUID().toString();

        long accessExpirySeconds = (long) accessTokenValidityMinutes * 60;
        long refreshExpirySeconds = (long) refreshTokenValidityMinutes * 60;

        tokenStore.storeAccessToken(accessToken, authentication, accessExpirySeconds);
        tokenStore.storeRefreshToken(refreshToken, authentication, refreshExpirySeconds);

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
        response.put("refresh_token", refreshToken);
        response.put("expires_in", accessExpirySeconds);
        response.put("scope", scope);
        response.put("ResponseInfo", responseInfo);
        response.put("UserRequest", secureUser.getUser());

        return response;
    }
}
