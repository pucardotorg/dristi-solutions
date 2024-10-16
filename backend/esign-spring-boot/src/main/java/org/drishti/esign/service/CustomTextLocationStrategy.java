package org.drishti.esign.service;

import com.itextpdf.text.pdf.parser.LocationTextExtractionStrategy;
import com.itextpdf.text.pdf.parser.TextRenderInfo;
import lombok.Getter;
import org.drishti.esign.web.models.TextLocation;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

public class CustomTextLocationStrategy extends LocationTextExtractionStrategy {
    private final String targetText;
    @Getter
    private List<TextLocation> textLocations = new ArrayList<>();

    public CustomTextLocationStrategy(String targetText) {
        this.targetText = targetText;
    }


    @Override
    public void renderText(TextRenderInfo renderInfo) {
        super.renderText(renderInfo);
        String text = renderInfo.getText();
        System.out.println(text +"\n");
        if (text.trim().equalsIgnoreCase(targetText)) { // Check for specific text match
            // Get the start and end locations of the text
            float startX = renderInfo.getBaseline().getStartPoint().get(0);
            float startY = renderInfo.getBaseline().getStartPoint().get(1);
            float endX = renderInfo.getDescentLine().getEndPoint().get(0);
            float endY = renderInfo.getDescentLine().getEndPoint().get(1);

            // Store the text and its coordinates
            textLocations.add(new TextLocation(text, startX, startY, endX, endY));
        }
    }

}
