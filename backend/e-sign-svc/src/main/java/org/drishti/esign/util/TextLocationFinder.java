package org.drishti.esign.util;


import com.itextpdf.text.pdf.parser.ImageRenderInfo;
import com.itextpdf.text.pdf.parser.RenderListener;
import com.itextpdf.text.pdf.parser.TextRenderInfo;
import lombok.Getter;
import lombok.Setter;

public class TextLocationFinder implements RenderListener {

    private String keyword;

    public TextLocationFinder(String keyword) {
        this.keyword = keyword;
    }

    @Setter
    @Getter
    private float x, y;
    public boolean found = false;


    @Override
    public void renderText(TextRenderInfo renderInfo) {
        String text = renderInfo.getText();
        if (text != null && text.contains(keyword)) {
            x = renderInfo.getBaseline().getStartPoint().get(0);
            y = renderInfo.getBaseline().getStartPoint().get(1);
            found = true;
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
