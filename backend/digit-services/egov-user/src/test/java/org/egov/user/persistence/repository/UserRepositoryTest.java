package org.egov.user.persistence.repository;

import org.egov.tracer.model.CustomException;
import org.egov.user.Resources;
import org.egov.user.domain.exception.InvalidRoleCodeException;
import org.egov.user.domain.model.Address;
import org.egov.user.domain.model.Role;
import org.egov.user.domain.model.User;
import org.egov.user.domain.model.UserSearchCriteria;
import org.egov.user.domain.model.enums.AddressType;
import org.egov.user.domain.model.enums.BloodGroup;
import org.egov.user.domain.model.enums.Gender;
import org.egov.user.domain.model.enums.UserType;
import org.egov.user.repository.builder.UserTypeQueryBuilder;
import org.egov.user.repository.rowmapper.UserResultSetExtractor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

@Disabled("Requires MDMS service configuration update for Jakarta")
@ExtendWith(SpringExtension.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
public class UserRepositoryTest {

    @Autowired
    private AuditRepository auditRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private NamedParameterJdbcTemplate namedParameterJdbcTemplate;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserTypeQueryBuilder userTypeQueryBuilder;

    @Autowired
    private UserResultSetExtractor userResultSetExtractor;

    private UserRepository userRepository;

    private MockRestServiceServer server;

    @Autowired
    private RestTemplate restTemplate;

    @BeforeEach
    public void before() {
        server = MockRestServiceServer.bindTo(restTemplate).build();

        server.expect(once(), requestTo("http://localhost:8094/egov-mdms-service/v1/_search"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess(new Resources().getFileContents("roleSearchValidatedResponse.json"),
                        MediaType.APPLICATION_JSON));

        userRepository = new UserRepository(roleRepository, userTypeQueryBuilder, addressRepository,
                userResultSetExtractor,
                jdbcTemplate, namedParameterJdbcTemplate, auditRepository);
    }

    @Test
    @Sql(scripts = {"/sql/clearUserRoles.sql", "/sql/clearUsers.sql", "/sql/createUsers.sql"})
    public void test_should_return_true_when_user_exists_with_given_user_name_and_tenant() {
        boolean isPresent = userRepository.isUserPresent("bigcat399", "ap.public", UserType.EMPLOYEE);
        assertTrue(isPresent);
    }

    @Test
    public void test_should_return_false_when_user_does_not_exist_with_given_user_name_and_tenant() {
        boolean isPresent = userRepository.isUserPresent("userName", "ap.public", UserType.EMPLOYEE);
        assertFalse(isPresent);
    }

    @Test
    @Sql(scripts = {"/sql/clearUserRoles.sql", "/sql/clearUsers.sql", "/sql/createUsers.sql", "/sql/createUserRoles.sql"})
    public void test_get_user_by_userName() {
        User user = userRepository.findAll(UserSearchCriteria.builder().userName("bigcat399")
                .tenantId("ap.public").type(UserType.EMPLOYEE).build()).get(0);

        assertThat(user.getId()).isEqualTo(1L);
        assertThat(user.getUsername()).isEqualTo("bigcat399");
        assertThat(user.getMobileNumber()).isEqualTo("9731123456");
        assertThat(user.getEmailId()).isEqualTo("kay.alexander@example.com");
        assertThat(user.getTenantId()).isEqualTo("ap.public");
    }

    @Test
    @Sql(scripts = {"/sql/clearUserRoles.sql", "/sql/clearUsers.sql", "/sql/clearRoles.sql", "/sql/createRoles.sql"})
    public void test_should_save_entity_user() {
        final Set<Role> roles = new HashSet<>();
        roles.add(Role.builder().code("EMP").tenantId("ap.public").build());

        User domainUser = User.builder().roles(roles).name("test1").username("TestUserName").password("password")
                .emailId("Test@gmail.com").aadhaarNumber("AadharNumber").mobileNumber("1234567890").active(true)
                .gender(Gender.FEMALE).bloodGroup(BloodGroup.A_NEGATIVE).accountLocked(true).loggedInUserId(10L)
                .createdBy(10L).tenantId("ap.public").build();

        User actualUser = userRepository.create(domainUser);

        assertNotNull(actualUser);
        assertThat(actualUser.getId()).isEqualTo(1L);
        assertThat(actualUser.getUsername()).isEqualTo("TestUserName");
        assertThat(actualUser.getTenantId()).isEqualTo("ap.public");
    }

    @Test
    public void test_should_throw_exception_when_role_does_not_exist_for_given_role_code() {
        final String roleCode = "roleCode1";
        final Role domainRole = Role.builder().name(roleCode).build();

        User domainUser = User.builder()
                .tenantId("ap.p")
                .roles(Collections.singleton(domainRole)).build();

        assertThrows(CustomException.class, () -> userRepository.create(domainUser));
    }

    @Test
    @Sql(scripts = {"/sql/clearUserRoles.sql", "/sql/clearUsers.sql", "/sql/clearRoles.sql", "/sql/createRoles.sql", "/sql/clearAddresses.sql"})
    public void test_should_set_encrypted_password_to_new_user() {
        final Set<Role> roles = new HashSet<>();
        roles.add(Role.builder().code("EMP").tenantId("ap.public").build());

        User domainUser = User.builder().roles(roles)
                .username("Test UserName").password("rawPassword").tenantId("ap.public").build();

        User actualUser = userRepository.create(domainUser);

        assertNotNull(actualUser);
        assertThat(actualUser.getPassword()).startsWith("$2a$10$"); // Verifying Bcrypt prefix
    }

    @Test
    @Sql(scripts = {"/sql/clearUserRoles.sql", "/sql/clearUsers.sql", "/sql/clearRoles.sql", "/sql/createRoles.sql", "/sql/clearAddresses.sql", "/sql/createUsers.sql"})
    public void test_search_user_byId() {
        List<Long> idList = Arrays.asList(1L, 2L, 3L);
        UserSearchCriteria userSearch = UserSearchCriteria.builder().tenantId("ap.public").id(idList).build();

        List<User> actualList = userRepository.findAll(userSearch);
        assertThat(actualList).hasSize(3);
    }

    @Test
    @Disabled("Update logic verification required for Java 25")
    public void test_should_update_entity_user() {
        final Set<Role> roles = new HashSet<>();
        roles.add(Role.builder().code("EMP").build());

        User domainUser = User.builder().roles(roles).name("test1").id(1L).username("TestUserName").password("password")
                .emailId("Test@gmail.com").aadhaarNumber("AadharNumber").mobileNumber("1234567890").active(true)
                .gender(Gender.FEMALE).bloodGroup(BloodGroup.A_NEGATIVE).accountLocked(true).loggedInUserId(10L)
                .createdBy(10L).tenantId("ap.public").build();

        userRepository.update(domainUser, domainUser, domainUser.getId(), domainUser.getUuid());

        User actualUser = userRepository.findAll(UserSearchCriteria.builder().userName("TestUserName")
                .tenantId("ap.public").type(UserType.CITIZEN).build()).get(0);

        assertThat(actualUser).isNotNull();
        assertThat(actualUser.getUsername()).isEqualTo("TestUserName");
    }

    @Test
    @Disabled
    public void test_should_throw_exception_when_updating_user_with_invalid_role_code() {
        final String roleCode = "roleCode1";
        final Role domainRole = Role.builder().name(roleCode).build();

        User domainUser = User.builder()
                .roles(Collections.singleton(domainRole)).id(1L).tenantId("ap.public").build();

        assertThrows(InvalidRoleCodeException.class, () ->
                userRepository.update(domainUser, domainUser, domainUser.getId(), domainUser.getUuid())
        );
    }
}