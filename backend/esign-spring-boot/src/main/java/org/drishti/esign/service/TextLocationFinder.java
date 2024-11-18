package org.drishti.esign.service;

import com.itextpdf.text.pdf.parser.ImageRenderInfo;
import com.itextpdf.text.pdf.parser.RenderListener;
import com.itextpdf.text.pdf.parser.TextRenderInfo;
import lombok.Getter;
import lombok.Setter;

public class TextLocationFinder implements RenderListener {

    private String keyword;
    private StringBuilder currentText = new StringBuilder();
    private Float lastY;

    public TextLocationFinder(String keyword) {
        this.keyword = keyword;
    }

    @Setter
    @Getter
    private float x, y;
    boolean found = false;


    @Override
    public void renderText(TextRenderInfo renderInfo) {
        String text = renderInfo.getText();
        if (text != null) {
            Float currentY = renderInfo.getBaseline().getStartPoint().get(1);
            if (lastY != null && !currentY.equals(lastY)) {
                currentText = new StringBuilder();
            }
            lastY = currentY;
            currentText.append(text);
            if (currentText.toString().contains(keyword)) {
                currentText = new StringBuilder();
                x = renderInfo.getBaseline().getStartPoint().get(0);
                y = renderInfo.getBaseline().getStartPoint().get(1);
                found = true;
            }
        }
    }


    @Override
    public void renderImage(ImageRenderInfo renderInfo) {
    }

    @Override
    public void beginTextBlock() {
    }

    @Override
    public void endTextBlock() {
    }
}
