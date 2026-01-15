package org.drishti.esign.util;


import com.itextpdf.text.pdf.parser.ImageRenderInfo;
import com.itextpdf.text.pdf.parser.RenderListener;
import com.itextpdf.text.pdf.parser.TextRenderInfo;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class TextLocationFinder implements RenderListener {

    private String keyword;

    public TextLocationFinder(String keyword) {
        this.keyword = keyword;
    }

    @Setter
    @Getter
    private float keywordX, keywordY;
    private StringBuilder currentText = new StringBuilder();
    private Float lastY;
    private float firstCharX;

    @Getter
    private Boolean keywordFound = false;


    @Override
    public void renderText(TextRenderInfo renderInfo) {
        String text = renderInfo.getText();
        if (text != null) {
            Float currentY = renderInfo.getBaseline().getStartPoint().get(1);
            float currentX = renderInfo.getBaseline().getStartPoint().get(0);
            
            if (lastY != null && !currentY.equals(lastY)) {
                currentText = new StringBuilder();
                firstCharX = 0;
            }
            
            lastY = currentY;
            
            String before = currentText.toString();
            currentText.append(text);
            String after = currentText.toString();
            
            if (!before.contains(keyword) && after.contains(keyword)) {
                int keywordStartIndex = after.indexOf(keyword);
                int chunkStartIndex = before.length();
                
                if (keywordStartIndex >= chunkStartIndex) {
                    int offsetInChunk = keywordStartIndex - chunkStartIndex;
                    float chunkWidth = renderInfo.getBaseline().getEndPoint().get(0) - currentX;
                    float avgCharWidth = text.length() > 0 ? chunkWidth / text.length() : 0;
                    keywordX = currentX + (offsetInChunk * avgCharWidth);
                } else {
                    keywordX = firstCharX;
                }
                keywordY = currentY;
                keywordFound = true;
                currentText = new StringBuilder();
                log.debug("Keyword '{}' found at coordinates ({}, {})", keyword, keywordX, keywordY);
            } else if (after.startsWith(keyword.substring(0, Math.min(keyword.length(), after.length())))) {
                if (firstCharX == 0) {
                    firstCharX = currentX;
                }
            }
        }
    }


    @Override
    public void renderImage(ImageRenderInfo renderInfo) {
        // Not used in current implementation
    }

    @Override
    public void beginTextBlock() {
        // Not used in current implementation
    }

    @Override
    public void endTextBlock() {
        // Not used in current implementation
    }
}
