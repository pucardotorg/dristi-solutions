package digit.config;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@ConfigurationProperties(prefix = "pdf")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PdfConfig {

    private Map<String, String> templates;
    private Signature signature;

    @Getter
    @Setter
    public static class Signature {
        private boolean enabled;
        private Map<String, TemplateConfig> templateConfigs;
        private TemplateConfig defaultConfig;

        public TemplateConfig getConfigForTemplate(String templateName) {
            if (templateConfigs != null && templateConfigs.containsKey(templateName)) {
                return templateConfigs.get(templateName);
            }
            return defaultConfig;
        }

        @Getter
        @Setter
        public static class TemplateConfig {
            private String fieldName;
            private Position position;
            private List<AdditionalField> additionalFields;
        }

        @Getter
        @Setter
        public static class AdditionalField {
            private String fieldName;
            private Position position;
        }

        @Getter
        @Setter
        public static class Position {
            private int x;
            private int y;
            private int width;
            private int height;
        }
    }
}

