let globalCounter = 0;

const transform = (data) => {
    try {
        return {
            ...data,
            workflow: {
                ...(data?.workflow || {}),
                action: "ISSUE_ORDER"
            }
        };
    } catch (err) {
        console.log(err);
        return data;
    }

}

const analysis = (data) => {
    try {
        if (data.status !== 'PENDING_NOTICE' && data.status !== 'PENDING_ADMISSION_HEARING') return false;
        else return true;

    }
    catch (err) {
        return false;
    }

}

const trimDocument = (document) => {
    const { fileStore, documentType } = document;
    return { fileStore, documentType, fileName: 'UPLOAD_VAKALATNAMA', documentName: `vakalatnama_${globalCounter++}.png` };
}



module.exports = { transform, analysis };






