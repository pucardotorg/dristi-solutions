package digit.util;

import org.junit.jupiter.api.Test;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class ByteArrayMultipartFileTest {

    @Test
    void basicBehaviors() throws Exception {
        byte[] content = "hello pdf".getBytes();
        ByteArrayMultipartFile mf = new ByteArrayMultipartFile("doc.pdf", content);

        assertEquals("doc.pdf", mf.getName());
        assertEquals("doc.pdf", mf.getOriginalFilename());
        assertEquals("application/pdf", mf.getContentType());
        assertFalse(mf.isEmpty());
        assertEquals(content.length, mf.getSize());
        assertArrayEquals(content, mf.getBytes());
        assertNotNull(mf.getInputStream());
    }

    @Test
    void transferTo_WritesToFileAndPath() throws Exception {
        byte[] content = "content".getBytes();
        ByteArrayMultipartFile mf = new ByteArrayMultipartFile("doc.pdf", content);

        File tmp = File.createTempFile("test", ".bin");
        tmp.deleteOnExit();
        mf.transferTo(tmp);
        assertEquals(content.length, tmp.length());

        Path path = Files.createTempFile("test2", ".bin");
        mf.transferTo(path);
        assertArrayEquals(content, Files.readAllBytes(path));
    }
}
