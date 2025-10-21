package com.dristi.njdg_transformer.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class JudgeDetails {

        @JsonProperty("judge_code")
        private Integer judgeCode;

        @JsonProperty("judge_name")
        private String judgeName;

        @JsonProperty("jocode")
        private String jocode;

        @JsonProperty("judge_username")
        private String judgeUsername;
}
