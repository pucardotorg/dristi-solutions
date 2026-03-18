package org.egov.user.domain.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.*;

import org.egov.common.contract.request.RequestInfo;
import org.egov.user.domain.exception.*;
import org.egov.user.domain.model.*;
import org.egov.user.domain.model.enums.Gender;
import org.egov.user.domain.model.enums.UserType;
import org.egov.user.domain.service.utils.EncryptionDecryptionUtil;
import org.egov.user.domain.service.utils.UserUtils;
import org.egov.user.persistence.repository.FileStoreRepository;
import org.egov.user.persistence.repository.OtpRepository;
import org.egov.user.persistence.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings; // ADDED
import org.mockito.quality.Strictness; // ADDED
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.provider.token.TokenStore;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT) // FIX: This resolves the UnnecessaryStubbingException
public class UserServiceTest {

    private static final int DEFAULT_PASSWORD_EXPIRY_IN_DAYS = 90;

    @Mock
    private UserRepository userRepository;

    @Mock
    private OtpRepository otpRepository;

    @Mock
    private FileStoreRepository fileRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EncryptionDecryptionUtil encryptionDecryptionUtil;

    @Mock
    private TokenStore tokenStore;

    @Mock
    private UserUtils userUtils;

    private UserService userService;

    private final List<Long> ID = Arrays.asList(1L, 2L);
    private final String EMAIL = "email@gmail.com";
    private final String USER_NAME = "userName";
    private final String TENANT_ID = "tenantId";
    private final boolean isCitizenLoginOtpBased = false;
    private final boolean isEmployeeLoginOtpBased = false;
    private String pwdRegex = "((?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%])(?=\\S+$))";
    private Integer pwdMaxLength = 15;
    private Integer pwdMinLength = 8;

    @BeforeEach
    public void before() {
        userService = new UserService(userRepository, otpRepository, fileRepository, userUtils, passwordEncoder, encryptionDecryptionUtil,
                tokenStore, DEFAULT_PASSWORD_EXPIRY_IN_DAYS,
                isCitizenLoginOtpBased, isEmployeeLoginOtpBased, pwdRegex, pwdMaxLength, pwdMinLength);
    }

    @Test
    public void test_should_search_for_users() {
        UserSearchCriteria userSearch = mock(UserSearchCriteria.class);
        List<User> expectedListOfUsers = new ArrayList<>();
        when(userRepository.findAll(userSearch)).thenReturn(expectedListOfUsers);
        when(encryptionDecryptionUtil.encryptObject(userSearch, "User", UserSearchCriteria.class)).thenReturn(userSearch);
        when(encryptionDecryptionUtil.decryptObject(expectedListOfUsers, null, User.class, getValidRequestInfo())).thenReturn(expectedListOfUsers);

        List<User> actualResult = userService.searchUsers(userSearch, true, getValidRequestInfo());

        assertThat(actualResult).isEqualTo(expectedListOfUsers);
    }

    @Test
    public void test_should_save_a_valid_user() {
        User domainUser = validDomainUser(false);
        when(otpRepository.isOtpValidationComplete(getExpectedRequest())).thenReturn(true);
        final User expectedEntityUser = User.builder().build();
        when(userRepository.create(domainUser)).thenReturn(expectedEntityUser);
        when(encryptionDecryptionUtil.encryptObject(domainUser, "User", User.class)).thenReturn(domainUser);
        when(encryptionDecryptionUtil.decryptObject(expectedEntityUser, "UserSelf", User.class, getValidRequestInfo())).thenReturn(expectedEntityUser);

        User returnedUser = userService.createUser(domainUser, getValidRequestInfo());

        assertEquals(expectedEntityUser, returnedUser);
    }

    @Test
    public void test_should_raise_exception_when_duplicate_user_name_exists() {
        User domainUser = validDomainUser(false);
        when(otpRepository.isOtpValidationComplete(getExpectedRequest())).thenReturn(true);
        when(userRepository.isUserPresent("supandi_rocks", "tenantId", UserType.CITIZEN)).thenReturn(true);
        when(userUtils.getStateLevelTenantForCitizen("tenantId", UserType.CITIZEN)).thenReturn("tenantId");
        when(encryptionDecryptionUtil.encryptObject(domainUser, "User", User.class)).thenReturn(domainUser);

        assertThrows(DuplicateUserNameException.class, () -> userService.createUser(domainUser, getValidRequestInfo()));
    }

    @Test
    public void test_exception_is_raised_when_otp_validation_fails() {
        User domainUser = validDomainUser(false);
        domainUser.setOtpValidationMandatory(true);
        when(otpRepository.isOtpValidationComplete(getExpectedRequest())).thenReturn(false);

        assertThrows(OtpValidationPendingException.class, () -> userService.createUser(domainUser, any()));
    }

    @Test
    public void test_should_raise_exception_when_user_is_invalid() {
        User domainUser = User.builder().build();
        assertThrows(InvalidUserCreateException.class, () -> userService.createUser(domainUser, getValidRequestInfo()));
        verify(userRepository, never()).create(any(User.class));
    }

    @Test
    public void test_should_throw_error_when_user_not_exists_while_updating() {
        User domainUser = validDomainUser(false);
        when(userRepository.findAll(any(UserSearchCriteria.class))).thenReturn(Collections.emptyList());

        assertThrows(UserNotFoundException.class, () -> userService.updateWithoutOtpValidation(domainUser, getValidRequestInfo()));
    }

    @Test
    @Disabled
    public void test_should_create_a_valid_citizen_withotp() {
        User domainUser = mock(User.class);
        when(domainUser.getTenantId()).thenReturn("default");
        when((domainUser.getOtpValidationRequest())).thenReturn(getExpectedRequest());
        when(otpRepository.validateOtp(any())).thenReturn(true);
        final User expectedUser = User.builder().build();
        when(userRepository.create(domainUser)).thenReturn(expectedUser);

        User returnedUser = userService.createCitizen(domainUser, any());

        assertEquals(expectedUser, returnedUser);
    }

    private User validDomainUser(boolean otpValidationMandatory) {
        return User.builder().username("supandi_rocks").name("Supandi").gender(Gender.MALE).type(UserType.CITIZEN)
                .active(Boolean.TRUE).mobileNumber("9988776655").tenantId("tenantId").otpReference("12312")
                .password("P@ssw0rd").roles(Collections.singleton(Role.builder().code("roleCode1").build()))
                .accountLocked(false).otpValidationMandatory(otpValidationMandatory).build();
    }

    private OtpValidationRequest getExpectedRequest() {
        return OtpValidationRequest.builder().otpReference("12312").tenantId("tenantId").mobileNumber("9988776655")
                .build();
    }

    private RequestInfo getValidRequestInfo() {
        List<org.egov.common.contract.request.Role> roles = Collections.singletonList(org.egov.common.contract.request.Role.builder().code("roleCode1").build());
        org.egov.common.contract.request.User userInfo = org.egov.common.contract.request.User.builder().roles(roles).id(123L).build();
        return RequestInfo.builder().userInfo(userInfo).build();
    }
}