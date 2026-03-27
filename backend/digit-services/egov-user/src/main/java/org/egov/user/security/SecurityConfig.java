package org.egov.user.security;

import org.egov.user.security.oauth2.custom.CustomAuthenticationManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;

@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    @Autowired
    private CustomAuthenticationManager customAuthenticationManager;

    /**
     * Expose the CustomAuthenticationManager as THE AuthenticationManager bean
     * for the entire application, including the OAuth2 authorization server.
     */
    @Override
    @Bean
    public AuthenticationManager authenticationManagerBean() throws Exception {
        return customAuthenticationManager;
    }

    /**
     * Override the internal authentication manager builder to prevent
     * WebSecurityConfigurerAdapter from creating its own default
     * DaoAuthenticationProvider (which would intercept authentication
     * before CustomAuthenticationManager).
     */
    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.parentAuthenticationManager(customAuthenticationManager);
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.csrf().disable();
    }
}