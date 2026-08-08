package com.example.gateway.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.PropertiesPropertySource;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;

import java.io.InputStream;
import java.util.Collections;
import java.util.Properties;

/**
 * Loads the externally generated routes file (produced by the
 * gateway-kubernetes-discovery init container and pointed to by
 * {@code spring.routes.filepath}) and remaps the deprecated Spring Cloud Gateway
 * property prefix {@code spring.cloud.gateway.routes} to the
 * {@code spring.cloud.gateway.server.webflux.routes} namespace introduced in
 * Spring Cloud 2025.0.0.
 *
 * <p>The generated file still uses the pre-2025 {@code spring.cloud.gateway.routes[N]}
 * keys. Under Spring Cloud 2025.0.0 those keys no longer bind, and
 * {@code spring-boot-properties-migrator} cannot help because the file is loaded after
 * the environment is prepared. Remapping here — during environment post-processing —
 * makes the generated routes bind again without touching the discovery image.
 *
 * <p>It also forces the Spring Cloud Kubernetes discovery locator off at the highest
 * precedence. The locator adds a default {@code RewritePath} that strips the service
 * prefix ({@code /egov-mdms-service/v1/_search} -> {@code /v1/_search}), which breaks
 * the open/mixed-mode auth whitelist (whitelist entries carry the full prefixed path).
 * The deployment enables the locator via the {@code SPRING_CLOUD_..._LOCATOR_ENABLED}
 * environment variable, which overrides application.properties; adding the override as
 * the first property source guarantees the generated routes (full path, no stripping)
 * are the ones used, regardless of that environment variable.
 */
public class RoutesPropertySourceEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final String ROUTES_LOCATION_PROPERTY = "spring.routes.filepath";
    private static final String OLD_PREFIX = "spring.cloud.gateway.routes";
    private static final String NEW_PREFIX = "spring.cloud.gateway.server.webflux.routes";
    private static final String DISCOVERY_LOCATOR_ENABLED_PROPERTY =
            "spring.cloud.gateway.server.webflux.discovery.locator.enabled";
    private static final String ROUTES_PROPERTY_SOURCE_NAME = "gatewayGeneratedRoutes";
    private static final String OVERRIDES_PROPERTY_SOURCE_NAME = "gatewayRouteOverrides";

    private final ResourceLoader resourceLoader = new DefaultResourceLoader();

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        // Force the prefix-stripping discovery locator off, above the deployment env var.
        environment.getPropertySources().addFirst(new MapPropertySource(
                OVERRIDES_PROPERTY_SOURCE_NAME,
                Collections.singletonMap(DISCOVERY_LOCATOR_ENABLED_PROPERTY, "false")));

        String location = environment.getProperty(ROUTES_LOCATION_PROPERTY);
        if (location == null || location.isBlank()) {
            return;
        }

        Resource resource = resourceLoader.getResource(location.trim());
        if (!resource.exists()) {
            return;
        }

        Properties source = new Properties();
        try (InputStream in = resource.getInputStream()) {
            source.load(in);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to load gateway routes from " + location, e);
        }

        Properties remapped = new Properties();
        for (String name : source.stringPropertyNames()) {
            String key = name.startsWith(OLD_PREFIX)
                    ? NEW_PREFIX + name.substring(OLD_PREFIX.length())
                    : name;
            remapped.setProperty(key, source.getProperty(name));
        }

        environment.getPropertySources()
                .addLast(new PropertiesPropertySource(ROUTES_PROPERTY_SOURCE_NAME, remapped));
    }

    @Override
    public int getOrder() {
        // Run after ConfigData (application.properties / env vars) is loaded so that
        // spring.routes.filepath is resolvable.
        return Ordered.LOWEST_PRECEDENCE;
    }
}
