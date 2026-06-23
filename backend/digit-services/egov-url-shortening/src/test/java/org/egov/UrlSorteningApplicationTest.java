package org.egov;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.DeserializationConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.cfg.ContextAttributes;
import com.fasterxml.jackson.databind.introspect.VisibilityChecker;
import com.fasterxml.jackson.databind.jsontype.PolymorphicTypeValidator;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import org.junit.jupiter.api.Test;

class UrlSorteningApplicationTest {

    @Test
    void testGetObjectMapper() {
        ObjectMapper actualObjectMapper = (new UrlSorteningApplication()).getObjectMapper();

        assertNotNull(actualObjectMapper, "ObjectMapper should be initialized");

        PolymorphicTypeValidator polymorphicTypeValidator = actualObjectMapper.getPolymorphicTypeValidator();
        assertTrue(polymorphicTypeValidator instanceof LaissezFaireSubTypeValidator);

        VisibilityChecker<?> visibilityChecker = actualObjectMapper.getVisibilityChecker();
        assertTrue(visibilityChecker instanceof VisibilityChecker.Std);

        assertNull(actualObjectMapper.getPropertyNamingStrategy());
        assertSame(actualObjectMapper.getFactory(), actualObjectMapper.getJsonFactory());

        DeserializationConfig deserializationConfig = actualObjectMapper.getDeserializationConfig();

        assertTrue(deserializationConfig.getAnnotationIntrospector() instanceof com.fasterxml.jackson.databind.introspect.JacksonAnnotationIntrospector);
        assertSame(visibilityChecker, deserializationConfig.getDefaultVisibilityChecker());

        JsonNodeFactory expectedNodeFactory = actualObjectMapper.getNodeFactory();
        assertSame(expectedNodeFactory, deserializationConfig.getNodeFactory());

        assertTrue(deserializationConfig.getDeserializationFeatures() > 0, "Deserialization features should be configured");

        assertTrue(deserializationConfig.getAttributes() instanceof ContextAttributes.Impl);
        assertSame(polymorphicTypeValidator, deserializationConfig.getPolymorphicTypeValidator());
    }
}