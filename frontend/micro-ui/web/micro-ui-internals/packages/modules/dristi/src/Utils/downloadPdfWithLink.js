import { downloadBlobFromAuthenticatedUrl } from "./downloadBlobFromUrl";

const downloadPdfWithLink = async (url, fileName) => {
  if (!url) {
    return;
  }
  await downloadBlobFromAuthenticatedUrl(url, fileName);
};

export default downloadPdfWithLink;
