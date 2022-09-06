package com.Yannie.springbootecommerce.config;

import com.okta.spring.boot.oauth.Okta;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;

@Configuration
public class SecurityConfiguration extends WebSecurityConfigurerAdapter {


    @Override
    protected void configure(HttpSecurity http) throws Exception {
        //protect endpoint /api/orders
        http.authorizeHttpRequests().antMatchers("/api/orders/**")
                .authenticated()
                .and()
                .oauth2ResourceServer()
                .jwt();

        // add cors
        http.cors();

        //force a non-empty response body
        Okta.configureResourceServer401ResponseBody(http);

        //disable CSRF since we dont use cookies for session tracking
        http.csrf().disable();
    }
}
