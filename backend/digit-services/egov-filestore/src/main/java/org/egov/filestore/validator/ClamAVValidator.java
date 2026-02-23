package org.egov.filestore.validator;

import lombok.extern.slf4j.Slf4j;
import org.egov.filestore.config.FileStoreConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.net.Socket;
import java.nio.ByteBuffer;

@Component
@Slf4j
public class ClamAVValidator {

    private final FileStoreConfig fileStoreConfig;

    @Autowired
    public ClamAVValidator(FileStoreConfig fileStoreConfig) {
        this.fileStoreConfig = fileStoreConfig;
    }

    /**
     * Returns true if the file is safe (no virus), false otherwise
     */
    public boolean isFileSafe(InputStream inputStream) throws IOException {
        if (!fileStoreConfig.isClamavEnabled()) {
            log.info("ClamAV is disabled. Skipping virus scan.");
            return true;
        }
        try (Socket socket = new Socket(fileStoreConfig.getClamavHost(), Integer.parseInt(fileStoreConfig.getClamavPort()));
             InputStream in = socket.getInputStream();
             java.io.OutputStream out = socket.getOutputStream()) {

            out.write("zINSTREAM\0".getBytes());
            out.flush();

            byte[] buffer = new byte[2048];
            int read;

            while ((read = inputStream.read(buffer)) >= 0) {
                byte[] chunkSize = ByteBuffer.allocate(4).putInt(read).array();
                out.write(chunkSize);
                out.write(buffer, 0, read);
                out.flush();
            }

            // End of stream
            out.write(new byte[]{0, 0, 0, 0});
            out.flush();

            // Read ClamAV response
            StringBuilder sb = new StringBuilder();
            int ch;
            while ((ch = in.read()) != -1) {
                sb.append((char) ch);
            }

            String response = sb.toString();
            return response.contains("OK");
        }
    }
}
