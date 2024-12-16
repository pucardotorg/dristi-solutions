package org.drishti.esign.repository;

import org.drishti.esign.repository.rowmapper.EsignRowMapper;
import org.drishti.esign.web.models.ESignParameter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.when;


@ExtendWith(MockitoExtension.class)
public class EsignRequestRepositoryTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private EsignRowMapper rowMapper;

    @InjectMocks
    private EsignRequestRepository repository;


    @Test
    @DisplayName("should return Esign parameter object for id")
    void shouldReturnESignParameterObjectForID() {

        String id = "123654";

        ESignParameter mockedESign = ESignParameter.builder()
                .id("123654")
                .authType("OTP")
                .fileStoreId("file-456")
                .tenantId("tenant-k")
                .build();

        List<ESignParameter> expectedList = Collections.singletonList(mockedESign);

        when(jdbcTemplate.query(ArgumentMatchers.contains("SELECT * FROM dristi_esign_pdf de WHERE id = ?"),
                new List[]{anyList()},
                any(int[].class),
                any(RowMapper.class))).thenReturn(expectedList);
        ESignParameter recievedESignParameter = repository.getESignDetails(id);

        assertNotNull(recievedESignParameter);
        assertEquals(mockedESign.getId(), recievedESignParameter.getId());
        assertEquals(mockedESign.getFileStoreId(), recievedESignParameter.getFileStoreId());

    }
}
