package com.dristi.njdg_transformer.utils;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class JsonUtilTest {

    @InjectMocks
    private JsonUtil jsonUtil;

    private Map<String, Object> testData;

    @BeforeEach
    void setUp() {
        testData = new HashMap<>();
        
        Map<String, Object> level1 = new HashMap<>();
        Map<String, Object> level2 = new HashMap<>();
        
        level2.put("stringValue", "testString");
        level2.put("intValue", 123);
        level2.put("boolValue", true);
        level2.put("listValue", Arrays.asList("a", "b", "c"));
        
        level1.put("nested", level2);
        testData.put("data", level1);
    }

    @Test
    void testGetNestedValue_StringValue() {
        String result = jsonUtil.getNestedValue(testData, 
                Arrays.asList("data", "nested", "stringValue"), String.class);

        assertEquals("testString", result);
    }

    @Test
    void testGetNestedValue_IntegerValue() {
        Integer result = jsonUtil.getNestedValue(testData, 
                Arrays.asList("data", "nested", "intValue"), Integer.class);

        assertEquals(123, result);
    }

    @Test
    void testGetNestedValue_BooleanValue() {
        Boolean result = jsonUtil.getNestedValue(testData, 
                Arrays.asList("data", "nested", "boolValue"), Boolean.class);

        assertTrue(result);
    }

    @Test
    void testGetNestedValue_ListValue() {
        List result = jsonUtil.getNestedValue(testData, 
                Arrays.asList("data", "nested", "listValue"), List.class);

        assertNotNull(result);
        assertEquals(3, result.size());
    }

    @Test
    void testGetNestedValue_NonExistentPath() {
        String result = jsonUtil.getNestedValue(testData, 
                Arrays.asList("data", "nonexistent", "value"), String.class);

        assertNull(result);
    }

    @Test
    void testGetNestedValue_NullData() {
        String result = jsonUtil.getNestedValue(null, 
                Arrays.asList("data", "nested", "stringValue"), String.class);

        assertNull(result);
    }

    @Test
    void testGetNestedValue_EmptyPath() {
        Object result = jsonUtil.getNestedValue(testData, 
                Collections.emptyList(), Map.class);

        assertNotNull(result);
    }

    @Test
    void testGetNestedValue_SingleLevelPath() {
        Map result = jsonUtil.getNestedValue(testData, 
                Collections.singletonList("data"), Map.class);

        assertNotNull(result);
        assertTrue(result.containsKey("nested"));
    }

    @Test
    void testGetNestedValue_WrongType() {
        Integer result = jsonUtil.getNestedValue(testData, 
                Arrays.asList("data", "nested", "stringValue"), Integer.class);

        assertNull(result);
    }

    @Test
    void testGetNestedValue_NonMapData() {
        String result = jsonUtil.getNestedValue("not a map", 
                Arrays.asList("some", "path"), String.class);

        assertNull(result);
    }

    @Test
    void testGetNestedValue_PathEndsAtNonMap() {
        String result = jsonUtil.getNestedValue(testData, 
                Arrays.asList("data", "nested", "stringValue", "extraPath"), String.class);

        assertNull(result);
    }

    @Test
    void testGetNestedValue_NullValueInPath() {
        testData.put("nullKey", null);
        
        String result = jsonUtil.getNestedValue(testData, 
                Collections.singletonList("nullKey"), String.class);

        assertNull(result);
    }

    @Test
    void testGetNestedValue_DeepNesting() {
        Map<String, Object> deep = new HashMap<>();
        Map<String, Object> current = deep;
        
        for (int i = 0; i < 10; i++) {
            Map<String, Object> next = new HashMap<>();
            current.put("level" + i, next);
            current = next;
        }
        current.put("value", "deepValue");

        List<String> path = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            path.add("level" + i);
        }
        path.add("value");

        String result = jsonUtil.getNestedValue(deep, path, String.class);

        assertEquals("deepValue", result);
    }

    @Test
    void testGetNestedValue_MapWithNullValues() {
        Map<String, Object> dataWithNulls = new HashMap<>();
        Map<String, Object> nested = new HashMap<>();
        nested.put("key", null);
        dataWithNulls.put("nested", nested);

        Object result = jsonUtil.getNestedValue(dataWithNulls, 
                Arrays.asList("nested", "key"), Object.class);

        assertNull(result);
    }

    @Test
    void testGetNestedValue_ArrayInPath() {
        Map<String, Object> dataWithArray = new HashMap<>();
        dataWithArray.put("array", Arrays.asList("item1", "item2"));

        List result = jsonUtil.getNestedValue(dataWithArray, 
                Collections.singletonList("array"), List.class);

        assertNotNull(result);
        assertEquals(2, result.size());
    }
}
