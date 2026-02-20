/*
 * eGov suite of products aim to improve the internal efficiency,transparency,
 * accountability and the service delivery of the government  organizations.
 *
 *  Copyright (C) 2016  eGovernments Foundation
 *
 *  The updated version of eGov suite of products as by eGovernments Foundation
 *  is available at http://www.egovernments.org
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see http://www.gnu.org/licenses/ or
 *  http://www.gnu.org/licenses/gpl.html .
 *
 *  In addition to the terms of the GPL license to be adhered to in using this
 *  program, the following additional terms are to be complied with:
 *
 *      1) All versions of this program, verbatim or modified must carry this
 *         Legal Notice.
 *
 *      2) Any misrepresentation of the origin of the material is prohibited. It
 *         is required that all modified versions of this material be marked in
 *         reasonable ways as different from the original version.
 *
 *      3) This license does not grant any rights to any user of the program
 *         with regards to rights under trademark law for use of the trade names
 *         or trademarks of eGovernments Foundation.
 *
 *  In case of any queries, you can reach eGovernments Foundation at contact@egovernments.org.
 */

package org.egov.web.notification.mail.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import lombok.Getter;

import java.util.List;
import java.util.Properties;

@Getter
@Configuration
public class ApplicationConfiguration {

    @Autowired
    private EmailProperties emailProperties;

    @Bean
    @ConditionalOnProperty(value = "mail.protocol", havingValue = "smtps")
    public JavaMailSenderImpl mailSenderSMTPS() {
        final JavaMailSenderImpl mailSender = getMailSender(emailProperties);
        final Properties mailProperties = getProperties(emailProperties, false);
        mailSender.setJavaMailProperties(mailProperties);
        return mailSender;
    }

    @Bean
    @ConditionalOnProperty(value = "mail.protocol", havingValue = "smtp")
    public JavaMailSenderImpl mailSenderSMTP() {
        final JavaMailSenderImpl mailSender = getMailSender(emailProperties);
        final Properties mailProperties = getProperties(emailProperties, true);
        mailSender.setJavaMailProperties(mailProperties);
        return mailSender;
    }

    private JavaMailSenderImpl getMailSender(EmailProperties emailProperties) {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setPort(emailProperties.getMailPort());
        mailSender.setHost(emailProperties.getMailHost());
        mailSender.setProtocol(emailProperties.getMailProtocol());
        mailSender.setUsername(emailProperties.getMailSenderUsername());
        mailSender.setPassword(emailProperties.getMailSenderPassword());
        return mailSender;
    }

    private Properties getProperties(EmailProperties emailProperties, boolean isSmtp) {
        Properties mailProperties = new Properties();
        if(isSmtp){
            mailProperties.setProperty("mail.smtp.starttls.enable", emailProperties.getMailStartTlsEnable());
            mailProperties.setProperty("mail.smtp.auth", emailProperties.getMailSmtpsAuth());
            mailProperties.setProperty("mail.smtp.debug", emailProperties.getMailSmtpsDebug());
            mailProperties.setProperty("mail.smtp.ssl.protocols", emailProperties.getMailSmtpSslProtocol());
        } else {
            mailProperties.setProperty("mail.smtps.auth", emailProperties.getMailSmtpsAuth());
            mailProperties.setProperty("mail.smtps.starttls.enable", emailProperties.getMailStartTlsEnable());
            mailProperties.setProperty("mail.smtps.ssl.enable", emailProperties.getMailSslEnable());
            mailProperties.setProperty("mail.smtps.debug", emailProperties.getMailSmtpsDebug());
        }



        return mailProperties;
    }

    @Value("${egov.localization.host}")
    @Getter
    private String localizationHost;

    @Value("${egov.localization.context.path}")
    @Getter
    private String localizationContextPath;

    @Value("${egov.localization.search.endpoint}")
    @Getter
    private String localizationSearchEndpoint;


    @Value("${egov.user.host}")
    @Getter
    private String userHost;

    @Value("${egov.user.context.path}")
    @Getter
    private String userContextPath;

    @Value("${egov.user.search.endpoint}")
    @Getter
    private String userSearchEndpoint;

    @Value("${egov.user.state.tenant.id}")
    @Getter
    private String stateTenantId;

    @Value("${egov.filestore.host}")
    private String filestoreHost;

    @Value("${egov.filestore.path}")
    private String filestorePath;

    @Value("${egov.from.email}")
    private String senderEmail;

    @Value("${egov.mdms.host}")
    private String mdmsHost;

    @Value("${egov.mdms.search.endpoint}")
    private String mdmsEndPoint;

    @Value("${custom.email.subject}")
    private List<String> customEmailSubject;

}
