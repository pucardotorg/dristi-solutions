package org.egov.filestore.validator;

import org.springframework.web.multipart.MultipartFile;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.cos.*;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentCatalog;
import org.apache.pdfbox.pdmodel.PDDocumentNameDictionary;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDAnnotation;
import org.apache.pdfbox.pdmodel.interactive.form.PDAcroForm;
import org.apache.pdfbox.pdmodel.interactive.form.PDField;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.*;

public class PdfSecurityScanner {

    public static class Result {
        // original flags
        private final boolean hasJavaScript;
        private final boolean hasOpenAction;
        private final boolean hasAA;
        private final boolean hasLaunch;
        private final boolean hasEmbeddedFiles;
        private final boolean hasRichMedia;
        private final boolean hasAcroForm;
        private final boolean hasFileAttachments;
        private final boolean isEncrypted;
        private final boolean hasXfa;

        // enhancements
        private final boolean hasJsInStreams;
        private final boolean hasObjStm;
        private final boolean hasXRefStream;
        private final boolean hasSuspiciousFilters;
        private final int embeddedFileCount;
        private final int objectCount;
        private final int streamCount;
        private final List<String> suspiciousStreamSamples; // short samples of suspicious streams

        public Result(boolean hasJavaScript, boolean hasOpenAction, boolean hasAA, boolean hasLaunch,
                      boolean hasEmbeddedFiles, boolean hasRichMedia, boolean hasAcroForm,
                      boolean hasFileAttachments, boolean isEncrypted, boolean hasXfa,
                      boolean hasJsInStreams, boolean hasObjStm, boolean hasXRefStream,
                      boolean hasSuspiciousFilters, int embeddedFileCount, int objectCount,
                      int streamCount, List<String> suspiciousStreamSamples) {
            this.hasJavaScript = hasJavaScript;
            this.hasOpenAction = hasOpenAction;
            this.hasAA = hasAA;
            this.hasLaunch = hasLaunch;
            this.hasEmbeddedFiles = hasEmbeddedFiles;
            this.hasRichMedia = hasRichMedia;
            this.hasAcroForm = hasAcroForm;
            this.hasFileAttachments = hasFileAttachments;
            this.isEncrypted = isEncrypted;
            this.hasXfa = hasXfa;
            this.hasJsInStreams = hasJsInStreams;
            this.hasObjStm = hasObjStm;
            this.hasXRefStream = hasXRefStream;
            this.hasSuspiciousFilters = hasSuspiciousFilters;
            this.embeddedFileCount = embeddedFileCount;
            this.objectCount = objectCount;
            this.streamCount = streamCount;
            this.suspiciousStreamSamples = suspiciousStreamSamples == null ? Collections.emptyList() : suspiciousStreamSamples;
        }

        // getters...
        public boolean hasJavaScript() { return hasJavaScript; }
        public boolean hasOpenAction() { return hasOpenAction; }
        public boolean hasAA() { return hasAA; }
        public boolean hasLaunch() { return hasLaunch; }
        public boolean hasEmbeddedFiles() { return hasEmbeddedFiles; }
        public boolean hasRichMedia() { return hasRichMedia; }
        public boolean hasAcroForm() { return hasAcroForm; }
        public boolean hasFileAttachments() { return hasFileAttachments; }
        public boolean isEncrypted() { return isEncrypted; }
        public boolean hasXfa() { return hasXfa; }

        public boolean hasJsInStreams() { return hasJsInStreams; }
        public boolean hasObjStm() { return hasObjStm; }
        public boolean hasXRefStream() { return hasXRefStream; }
        public boolean hasSuspiciousFilters() { return hasSuspiciousFilters; }
        public int getEmbeddedFileCount() { return embeddedFileCount; }
        public int getObjectCount() { return objectCount; }
        public int getStreamCount() { return streamCount; }
        public List<String> getSuspiciousStreamSamples() { return suspiciousStreamSamples; }
    }

    // thresholds / config (tune as needed)
    private static final int SUSPICIOUS_STREAM_SAMPLE_MAX = 3;
    

    public static Result scan(MultipartFile pdfFile) throws IOException {
        boolean hasJavaScript = false;
        boolean hasOpenAction = false;
        boolean hasAA = false;
        boolean hasLaunch = false;
        boolean hasEmbeddedFiles = false;
        boolean hasRichMedia = false;
        boolean hasAcroForm = false;
        boolean hasFileAttachments = false;
        boolean isEncrypted = false;
        boolean hasXfa = false;

        boolean hasJsInStreams = false;
        boolean hasObjStm = false;
        boolean hasXRefStream = false;
        boolean hasSuspiciousFilters = false;
        int embeddedFileCount = 0;
        int objectCount = 0;
        int streamCount = 0;
        List<String> suspiciousStreamSamples = new ArrayList<>();

        // load read-only (do not save or modify)
        try (InputStream is = pdfFile.getInputStream()) {
            Path tmp = Files.createTempFile("pdfscan-", ".pdf");
            try {
                Files.copy(is, tmp, StandardCopyOption.REPLACE_EXISTING);
                try (PDDocument doc = Loader.loadPDF(tmp.toFile())) {
            isEncrypted = doc.isEncrypted();

            // If encrypted, report and avoid deep scanning
            if (isEncrypted) {
                return new Result(false, false, false, false, false, false, false, false, true, false,
                        false, false, false, false, 0, 0, 0, Collections.<String>emptyList());
            }

            PDDocumentCatalog catalog = doc.getDocumentCatalog();
            COSDictionary catalogDict = catalog.getCOSObject();

            if (catalogDict != null) {
                hasOpenAction = catalogDict.containsKey(COSName.getPDFName("OpenAction"));
                hasAA = catalogDict.containsKey(COSName.getPDFName("AA"));
            }

            // Check OpenAction type (S key)
            COSBase openAction = catalogDict == null ? null : catalogDict.getDictionaryObject(COSName.getPDFName("OpenAction"));
            if (openAction instanceof COSDictionary) {
                String sType = ((COSDictionary) openAction).getNameAsString(COSName.getPDFName("S"));
                if (sType != null) {
                    if ("JavaScript".equalsIgnoreCase(sType)) hasJavaScript = true;
                    if ("Launch".equalsIgnoreCase(sType)) hasLaunch = true;
                }
            }

            // Names dictionary checks (JavaScript, EmbeddedFiles)
            PDDocumentNameDictionary names = catalog.getNames();
            if (names != null) {
                COSDictionary namesDict = names.getCOSObject();
                if (namesDict != null) {
                    if (namesDict.containsKey(COSName.getPDFName("JavaScript"))) {
                        hasJavaScript = true;
                    }
                    if (namesDict.containsKey(COSName.getPDFName("EmbeddedFiles"))) {
                        hasEmbeddedFiles = true;
                    }
                }
                try {
                    COSBase efBase = names.getCOSObject().getDictionaryObject(COSName.getPDFName("EmbeddedFiles"));
                    if (efBase instanceof COSDictionary) {
                        COSBase kids = ((COSDictionary) efBase).getDictionaryObject(COSName.getPDFName("Names"));
                        if (kids instanceof COSArray) {
                            Set<COSBase> uniqueEf = java.util.Collections.newSetFromMap(new java.util.IdentityHashMap<>());
                            COSArray arr = (COSArray) kids;
                            for (int i = 1; i < arr.size(); i += 2) {
                                COSBase spec = arr.get(i);
                                if (spec instanceof COSObject) spec = ((COSObject) spec).getObject();
                                if (spec instanceof COSDictionary) {
                                    COSBase efDictBase = ((COSDictionary) spec).getDictionaryObject(COSName.getPDFName("EF"));
                                    if (efDictBase instanceof COSDictionary) {
                                        COSDictionary efDict = (COSDictionary) efDictBase;
                                        COSBase f1 = efDict.getDictionaryObject(COSName.getPDFName("F"));
                                        COSBase f2 = efDict.getDictionaryObject(COSName.getPDFName("UF"));
                                        if (f1 instanceof COSObject) f1 = ((COSObject) f1).getObject();
                                        if (f2 instanceof COSObject) f2 = ((COSObject) f2).getObject();
                                        if (f1 instanceof COSStream) uniqueEf.add(f1);
                                        if (f2 instanceof COSStream) uniqueEf.add(f2);
                                    }
                                }
                            }
                            embeddedFileCount = uniqueEf.size();
                            if (embeddedFileCount > 0) hasEmbeddedFiles = true;
                        }
                    }
                } catch (Exception ignored) {}
            }

            // AcroForm and XFA
            PDAcroForm acroForm = catalog.getAcroForm();
            if (acroForm != null) {
                hasAcroForm = true;
                COSDictionary acroDict = acroForm.getCOSObject();
                if (acroDict != null) {
                    if (acroDict.containsKey(COSName.getPDFName("XFA"))) {
                        hasXfa = true;
                        try {
                            COSBase xfaObj = acroDict.getDictionaryObject(COSName.getPDFName("XFA"));
                            if (scanXfaForJs(xfaObj)) {
                                hasJsInStreams = true;
                            }
                        } catch (Exception ignored) {}
                    }
                    if (acroDict.containsKey(COSName.getPDFName("AA"))) {
                        hasAA = true;
                    }
                }

                if (acroForm.getFields() != null) {
                    for (PDField field : acroForm.getFields()) {
                        COSDictionary fd = field.getCOSObject();
                        if (fd == null) continue;
                        if (fd.containsKey(COSName.getPDFName("AA"))) {
                            hasAA = true;
                        }
                        COSBase fAction = fd.getDictionaryObject(COSName.getPDFName("A"));
                        if (fAction instanceof COSDictionary) {
                            String sType = ((COSDictionary) fAction).getNameAsString(COSName.getPDFName("S"));
                            if (sType != null) {
                                if ("JavaScript".equalsIgnoreCase(sType)) { hasJavaScript = true; }
                                if ("Launch".equalsIgnoreCase(sType)) { hasLaunch = true; }
                            }
                        }
                        if (fd.containsKey(COSName.getPDFName("JS"))) {
                            hasJavaScript = true;
                        }
                    }
                }
            }

            // Pages and annotations
            for (PDPage page : doc.getPages()) {
                COSDictionary pageDict = page.getCOSObject();
                if (pageDict != null && pageDict.containsKey(COSName.getPDFName("AA"))) {
                    hasAA = true;
                }
                List<PDAnnotation> annotations = page.getAnnotations();
                if (annotations != null) {
                    for (PDAnnotation ann : annotations) {
                        String subtype = ann.getSubtype();
                        if ("RichMedia".equalsIgnoreCase(subtype)) {
                            hasRichMedia = true;
                        }
                        if ("FileAttachment".equalsIgnoreCase(subtype)) {
                            hasFileAttachments = true;
                        }

                        COSDictionary annDict = ann.getCOSObject();
                        if (annDict != null) {
                            if (annDict.containsKey(COSName.getPDFName("AA"))) {
                                hasAA = true;
                            }
                            COSBase action = annDict.getDictionaryObject(COSName.getPDFName("A"));
                            if (action instanceof COSDictionary) {
                                String sType = ((COSDictionary) action).getNameAsString(COSName.getPDFName("S"));
                                if (sType != null) {
                                    if ("JavaScript".equalsIgnoreCase(sType)) hasJavaScript = true;
                                    if ("Launch".equalsIgnoreCase(sType)) hasLaunch = true;
                                }
                            }
                        }
                    }
                }
            }

            // --- Enhanced low-level scans over COS objects (streams, object streams, filters, counts) ---
            COSDocument cosDoc = doc.getDocument();
            Map<COSObjectKey, Long> xrefMap = cosDoc.getXrefTable();
            objectCount = xrefMap != null ? xrefMap.size() : 0;

            if (xrefMap != null) {
                for (Map.Entry<COSObjectKey, Long> entry : xrefMap.entrySet()) {
                    COSObject cosObject = cosDoc.getObjectFromPool(entry.getKey());
                    if (cosObject == null) continue;
                    COSBase base = cosObject.getObject();
                    if (base instanceof COSStream) {
                        streamCount++;
                        COSStream stream = (COSStream) base;
                        COSDictionary dict = stream;
                        String t = dict.getNameAsString(COSName.TYPE);
                        if ("ObjStm".equalsIgnoreCase(t)) {
                            hasObjStm = true;
                        }
                        if ("XRef".equalsIgnoreCase(t) || dict.containsKey(COSName.getPDFName("XRef"))) {
                            hasXRefStream = true;
                        }
                        try {
                            COSBase filterObj = dict.getDictionaryObject(COSName.FILTER);
                            if (filterObj != null) {
                                hasSuspiciousFilters |= analyzeFilterObject(filterObj, dict);
                            }
                        } catch (Exception ignored) {}
                        try (InputStream unfiltered = stream.createInputStream();
                             BufferedInputStream bis = new BufferedInputStream(unfiltered)) {
                            byte[] buf = new byte[4096];
                            int read = bis.read(buf);
                            if (read > 0) {
                                String sample = new String(buf, 0, read, java.nio.charset.StandardCharsets.ISO_8859_1).toLowerCase(Locale.ROOT);
                                boolean isImage = false;
                                try {
                                    String st = dict.getNameAsString(COSName.SUBTYPE);
                                    isImage = st != null && "Image".equalsIgnoreCase(st);
                                } catch (Exception ignored) {}
                                if (!isImage) {
                                    if (sample.contains("/javascript") || sample.contains("javascript:") || sample.contains("eval(") || sample.contains("this.exportdata") || sample.contains("getannots")) {
                                        hasJsInStreams = true;
                                        if (suspiciousStreamSamples.size() < SUSPICIOUS_STREAM_SAMPLE_MAX) {
                                            suspiciousStreamSamples.add(sample.length() > 512 ? sample.substring(0, 512) : sample);
                                        }
                                    }
                                }
                                if (sample.contains("%pdf") || sample.contains("pk\u0003\u0004") || sample.contains("mimetype:application/epub+zip")) {
                                    if (suspiciousStreamSamples.size() < SUSPICIOUS_STREAM_SAMPLE_MAX) {
                                        suspiciousStreamSamples.add(sample.length() > 512 ? sample.substring(0, 512) : sample);
                                    }
                                }
                            }
                        } catch (IOException ignored) {}
                    } else {
                        if (base instanceof COSDictionary) {
                            COSDictionary d = (COSDictionary) base;
                            if (d.containsKey(COSName.getPDFName("EmbeddedFile")) || d.containsKey(COSName.getPDFName("EF")) || d.containsKey(COSName.getPDFName("Filespec"))) {
                                hasEmbeddedFiles = true;
                            }
                        }
                    }
                }
            }

            

            if (embeddedFileCount == 0) {
                Set<COSBase> uniqueEf = java.util.Collections.newSetFromMap(new java.util.IdentityHashMap<>());
                if (xrefMap != null) {
                    for (Map.Entry<COSObjectKey, Long> e : xrefMap.entrySet()) {
                        COSObject obj = cosDoc.getObjectFromPool(e.getKey());
                        if (obj == null) continue;
                        COSBase b = obj.getObject();
                        if (b instanceof COSStream) {
                            COSDictionary d = (COSDictionary) b;
                            String tp = d.getNameAsString(COSName.TYPE);
                            if ("EmbeddedFile".equalsIgnoreCase(tp)) uniqueEf.add(b);
                        } else if (b instanceof COSDictionary) {
                            COSDictionary dd = (COSDictionary) b;
                            COSBase ef = dd.getDictionaryObject(COSName.getPDFName("EF"));
                            if (ef instanceof COSDictionary) {
                                COSDictionary efd = (COSDictionary) ef;
                                COSBase f1 = efd.getDictionaryObject(COSName.getPDFName("F"));
                                COSBase f2 = efd.getDictionaryObject(COSName.getPDFName("UF"));
                                if (f1 instanceof COSObject) f1 = ((COSObject) f1).getObject();
                                if (f2 instanceof COSObject) f2 = ((COSObject) f2).getObject();
                                if (f1 instanceof COSStream) uniqueEf.add(f1);
                                if (f2 instanceof COSStream) uniqueEf.add(f2);
                            }
                        }
                    }
                }
                embeddedFileCount = uniqueEf.size();
                if (embeddedFileCount > 0) hasEmbeddedFiles = true;
            }

            return new Result(
                    hasJavaScript,
                    hasOpenAction,
                    hasAA,
                    hasLaunch,
                    hasEmbeddedFiles,
                    hasRichMedia,
                    hasAcroForm,
                    hasFileAttachments,
                    isEncrypted,
                    hasXfa,
                    hasJsInStreams,
                    hasObjStm,
                    hasXRefStream,
                    hasSuspiciousFilters,
                    embeddedFileCount,
                    objectCount,
                    streamCount,
                    suspiciousStreamSamples
            );
                }
            } finally {
                try { Files.deleteIfExists(tmp); } catch (Exception ignored) {}
            }
        }
    }

    // analyze filter dictionary/array/name in a robust way
    private static boolean analyzeFilterObject(COSBase filterObj, COSDictionary streamDict) {
        try {
            boolean image = false;
            try {
                String subtype = streamDict == null ? null : streamDict.getNameAsString(COSName.SUBTYPE);
                if (subtype != null && "Image".equalsIgnoreCase(subtype)) image = true;
            } catch (Exception ignored) {}
            if (filterObj instanceof COSName) {
                String name = ((COSName) filterObj).getName();
                if ("Crypt".equals(name)) return true;
                if ("JBIG2Decode".equals(name)) return !image;
                return false;
            } else if (filterObj instanceof COSArray) {
                COSArray arr = (COSArray) filterObj;
                for (int i = 0; i < arr.size(); i++) {
                    COSBase e = arr.get(i);
                    if (e instanceof COSName) {
                        String n = ((COSName) e).getName();
                        if ("Crypt".equals(n)) return true;
                        if ("JBIG2Decode".equals(n) && !image) return true;
                    }
                }
            } else if (filterObj instanceof COSString) {
                String s = ((COSString) filterObj).getString();
                if (s.contains("Crypt")) return true;
                if (s.contains("JBIG2Decode") && !image) return true;
            }
        } catch (Exception ignored) {}
        return false;
    }

    private static boolean scanXfaForJs(COSBase xfaObj) {
        try {
            if (xfaObj instanceof COSStream) {
                try (InputStream is = ((COSStream) xfaObj).createInputStream();
                     BufferedInputStream bis = new BufferedInputStream(is)) {
                    byte[] buf = new byte[4096];
                    int read = bis.read(buf);
                    if (read > 0) {
                        String sample = new String(buf, 0, read, java.nio.charset.StandardCharsets.ISO_8859_1).toLowerCase(java.util.Locale.ROOT);
                        if (sample.contains("xfa:script") || sample.contains("javascript") || sample.contains("application/x-javascript") || sample.contains("event.script") || sample.contains("xfa.host")) {
                            return true;
                        }
                    }
                }
            } else if (xfaObj instanceof COSArray) {
                COSArray arr = (COSArray) xfaObj;
                for (int i = 1; i < arr.size(); i += 2) {
                    COSBase v = arr.get(i);
                    if (v instanceof COSObject) v = ((COSObject) v).getObject();
                    if (v instanceof COSStream) {
                        try (InputStream is = ((COSStream) v).createInputStream();
                             BufferedInputStream bis = new BufferedInputStream(is)) {
                            byte[] buf = new byte[4096];
                            int read = bis.read(buf);
                            if (read > 0) {
                                String sample = new String(buf, 0, read, java.nio.charset.StandardCharsets.ISO_8859_1).toLowerCase(java.util.Locale.ROOT);
                                if (sample.contains("xfa:script") || sample.contains("javascript") || sample.contains("application/x-javascript") || sample.contains("event.script") || sample.contains("xfa.host")) {
                                    return true;
                                }
                            }
                        } catch (Exception ignored) {}
                    }
                }
            } else if (xfaObj instanceof COSString) {
                String s = ((COSString) xfaObj).getString();
                String sample = s == null ? "" : s.toLowerCase(java.util.Locale.ROOT);
                if (sample.contains("xfa:script") || sample.contains("javascript") || sample.contains("application/x-javascript") || sample.contains("event.script") || sample.contains("xfa.host")) {
                    return true;
                }
            }
        } catch (Exception ignored) {}
        return false;
    }
}
