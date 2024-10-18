package org.drishti.esign.web.models;

import lombok.*;

@Builder
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class Coordinate {


    private float x, y;
    private boolean found;
    private int pageNumber;


}
