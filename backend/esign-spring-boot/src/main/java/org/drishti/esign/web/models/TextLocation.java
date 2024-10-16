package org.drishti.esign.web.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.ToString;

@AllArgsConstructor
@Builder
@ToString
@Data
public class TextLocation {

    private String text;
    private float startX, startY, endX, endY;
}
