package org.drishti.esign.web.models;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Builder
@Setter
@Getter
public class Coordinate {


    private float x, y;
    private boolean found;
    private int pageNumber;


}
