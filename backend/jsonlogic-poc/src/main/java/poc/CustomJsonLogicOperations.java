package poc;

import io.github.jamsesso.jsonlogic.JsonLogic;
import org.apache.commons.jexl3.JexlBuilder;
import org.apache.commons.jexl3.JexlContext;
import org.apache.commons.jexl3.JexlEngine;
import org.apache.commons.jexl3.JexlScript;
import org.apache.commons.jexl3.MapContext;

import java.util.Map;

/**
 * Encapsulates custom operations for JsonLogic.
 * Single Responsibility Principle (SRP): Responsible ONLY for defining and registering
 * case-specific and math-specific JsonLogic functions.
 */
public class CustomJsonLogicOperations {

    public static void register(JsonLogic jsonLogic, Map<String, String> customOperations) {
        if (customOperations == null || customOperations.isEmpty()) return;

        java.util.Map<String, Object> funcs = new java.util.HashMap<>();
        funcs.put("math", Math.class);
        funcs.put("Double", Double.class);
        funcs.put("String", String.class);

        JexlEngine jexl = new JexlBuilder()
                .cache(512)
                .strict(false)
                .silent(false)
                .namespaces(funcs)
                .create();

        for (Map.Entry<String, String> entry : customOperations.entrySet()) {
            String opName = entry.getKey();
            String scriptText = entry.getValue();

            // Pre-compile the script to JexlScript for performance
            JexlScript script = jexl.createScript(scriptText);

            jsonLogic.addOperation(opName, args -> {
                JexlContext context = new MapContext();
                context.set("args", args);

                try {
                    return script.execute(context);
                } catch (Exception e) {
                    System.err.println("Error evaluating MDMS custom operation '" + opName + "': " + e.getMessage());
                    return 0.0;
                }
            });
        }
    }
}
