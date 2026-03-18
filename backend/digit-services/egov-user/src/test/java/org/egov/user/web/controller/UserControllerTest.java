package org.egov.user.web.controller;

import static java.util.Arrays.asList;
import static java.util.Collections.singletonList;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;

import org.apache.commons.io.IOUtils;
import org.egov.common.utils.MultiStateInstanceUtil;
import org.egov.encryption.masking.MaskingService;
import org.egov.user.TestConfiguration;
import org.egov.user.domain.exception.InvalidUserSearchCriteriaException;
import org.egov.user.domain.model.Action;
import org.egov.user.domain.model.Address;
import org.egov.user.domain.model.SecureUser;
import org.egov.user.domain.model.UserDetail;
import org.egov.user.domain.model.UserSearchCriteria;
import org.egov.user.domain.model.enums.AddressType;
import org.egov.user.domain.model.enums.BloodGroup;
import org.egov.user.domain.model.enums.Gender;
import org.egov.user.domain.model.enums.GuardianRelation;
import org.egov.user.domain.model.enums.UserType;
import org.egov.user.domain.service.TokenService;
import org.egov.user.domain.service.UserService;
import org.egov.user.security.CustomAuthenticationKeyGenerator;
import org.egov.user.web.contract.auth.Role;
import org.egov.user.web.contract.auth.User;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatcher;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.core.OAuth2AccessToken; // Updated package
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

@Disabled("Requires MDMS service configuration") // Replacement for @Ignore
@ExtendWith(SpringExtension.class) // Replacement for @RunWith(SpringRunner.class)
@WebMvcTest(UserController.class)
@Import(TestConfiguration.class)
public class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @MockBean
    private TokenService tokenService;

    @MockBean
    private MultiStateInstanceUtil multiStateInstanceUtil;

    @MockBean
    private CustomAuthenticationKeyGenerator authenticationKeyGenerator;

    @MockBean
    private MaskingService maskingService;

    @Test
    @WithMockUser
    public void test_should_search_users() throws Exception {
        final UserSearchCriteria expectedSearchCriteria = UserSearchCriteria.builder()
                .active(true)
                .build();

        when(userService.searchUsers(argThat(new UserSearchActiveFlagMatcher(expectedSearchCriteria)), anyBoolean(), any()))
                .thenReturn(getUserModels());

        // Note: APPLICATION_JSON_UTF8 is deprecated, use APPLICATION_JSON
        mockMvc.perform(post("/_search/").contentType(MediaType.APPLICATION_JSON)
                        .content(getFileContents("getUserByIdRequest.json"))).andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(content().json(getFileContents("userSearchResponse.json")));
    }

    @Test
    @WithMockUser
    public void test_should_create_user_without_otp_validation() throws Exception {
        final Date expectedDate = toDate(LocalDateTime.of(1986, 8, 4, 0, 0));
        final org.egov.user.domain.model.User expectedUser = org.egov.user.domain.model.User.builder()
                .username("userName")
                .name("foo")
                .dob(expectedDate)
                .guardian("name of relative")
                .build();
        final ArgumentCaptor<org.egov.user.domain.model.User> argumentCaptor =
                ArgumentCaptor.forClass(org.egov.user.domain.model.User.class);
        when(userService.createUser(argumentCaptor.capture(), any())).thenReturn(expectedUser);

        mockMvc.perform(post("/users/_createnovalidate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(getFileContents("userCreateRequest.json")))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(content().json(getFileContents("userCreateSuccessResponse.json")));

        final org.egov.user.domain.model.User actualUser = argumentCaptor.getValue();
        assertEquals("foo", actualUser.getName());
        assertEquals("userName", actualUser.getUsername());
        assertEquals("name of relative", actualUser.getGuardian());
    }

    private String getFileContents(String fileName) {
        try {
            return IOUtils.toString(this.getClass().getClassLoader().getResourceAsStream(fileName), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    // FIX: ArgumentMatcher is an abstract class in modern Mockito, not an interface
    class UserSearchActiveFlagMatcher implements ArgumentMatcher<UserSearchCriteria> {

        private UserSearchCriteria expectedUserSearch;

        public UserSearchActiveFlagMatcher(UserSearchCriteria expectedUserSearch) {
            this.expectedUserSearch = expectedUserSearch;
        }

        @Override
        public boolean matches(UserSearchCriteria userSearch) {
            if (userSearch == null) return false;
            return Objects.equals(userSearch.getActive(), expectedUserSearch.getActive());
        }
    }

    private org.egov.user.web.contract.auth.User getUser() {
        return org.egov.user.web.contract.auth.User.builder()
                .id(18L)
                .userName("narasappa")
                .name("narasappa")
                .mobileNumber("123456789")
                .emailId("abc@gmail.com")
                .locale("en_IN")
                .type("EMPLOYEE")
                .active(Boolean.TRUE)
                .roles(getRoles())
                .tenantId("default")
                .build();
    }

    private Set<Role> getRoles() {
        Set<Role> roles = new HashSet<>();
        org.egov.user.domain.model.Role roleModel = org.egov.user.domain.model.Role.builder()
                .name("Employee")
                .code("EMPLOYEE")
                .build();
        roles.add(new Role(roleModel));
        return roles;
    }

    private List<org.egov.user.domain.model.User> getUserModels() {
        Date expectedDOB = toDate(LocalDateTime.of(1986, 8, 4, 5, 30));
        org.egov.user.domain.model.User user = org.egov.user.domain.model.User.builder()
                .id(1L)
                .username("userName")
                .name("name")
                .active(true)
                .dob(expectedDOB)
                .type(UserType.CITIZEN)
                .build();
        return Collections.singletonList(user);
    }

    private Date toDate(LocalDateTime localDateTime) {
        final ZonedDateTime expectedDateTime = ZonedDateTime.of(localDateTime, ZoneId.of("Asia/Calcutta"));
        return Date.from(expectedDateTime.toInstant());
    }
}