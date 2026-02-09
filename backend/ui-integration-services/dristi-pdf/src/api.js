const config = require("./config");
const Axios = require("axios");
const URL = require("url");
const { logger } = require("./logger");
const { Pool } = require("pg");
const fs = require("fs");
const FormData = require("form-data");

const axios = Axios.create();
axios.interceptors.response.use(
  (res) => res,
  (error) => {
    const { handleApiError } = require("./utils/errorHandler");
    return handleApiError(error, "API Request Interceptor");
  }
);

const pool = new Pool({
  user: config.DB_USER,
  host: config.DB_HOST,
  database: config.DB_NAME,
  password: config.DB_PASSWORD,
  port: config.DB_PORT,
});

const auth_token = config.auth_token;

async function search_task(taskNumber, tenantId, requestinfo, courtId) {
  try {
    return await axios({
      method: "post",
      url: URL.resolve(config.host.task, config.paths.task_search),
      data: {
        RequestInfo: requestinfo,
        criteria: {
          tenantId: tenantId,
          taskNumber: taskNumber,
          ...(courtId && { courtId: courtId }),
        },
      },
    });
  } catch (error) {
    logger.error(`Error in ${config.paths.task_search}: ${error.message}`);
    throw error;
  }
}

async function search_table_task(tenantId, requestinfo, criteria, pagination) {
  try {
    return await axios({
      method: "post",
      url: URL.resolve(config.host.task, config.paths.task_table_search),
      data: {
        RequestInfo: requestinfo,
        criteria,
        pagination,
        tenantId,
      },
    });
  } catch (error) {
    logger.error(
      `Error in ${config.paths.task_table_search}: ${error.message}`
    );
    throw error;
  }
}

async function search_task_v2(tenantId, requestinfo, criteria, pagination) {
  try {
    return await axios({
      method: "post",
      url: URL.resolve(config.host.task, config.paths.task_search),
      data: {
        RequestInfo: requestinfo,
        criteria,
        pagination,
        tenantId,
      },
    });
  } catch (error) {
    logger.error(`Error in ${config.paths.task_search}: ${error.message}`);
    throw error;
  }
}

async function search_case(cnrNumber, tenantId, requestinfo, courtId) {
  try {
    return await axios({
      method: "post",
      url: URL.resolve(config.host.case, config.paths.case_search),
      data: {
        RequestInfo: requestinfo,
        tenantId: tenantId,
        criteria: [
          {
            cnrNumber: cnrNumber,
            ...(courtId && { courtId: courtId }),
          },
        ],
      },
    });
  } catch (error) {
    logger.error(`Error in ${config.paths.case_search}: ${error.message}`);
    throw error;
  }
}

async function search_case_v2(criteria, tenantId, requestinfo) {
  return await axios({
    method: "post",
    url: URL.resolve(config.host.case, config.paths.case_search),
    data: {
      RequestInfo: requestinfo,
      tenantId: tenantId,
      criteria,
    },
  });
}

async function search_order(
  tenantId,
  orderId,
  requestinfo,
  courtId,
  isOrderNumber = false,
  filingNumber,
  status,
  orderType
) {
  return await axios({
    method: "post",
    url: URL.resolve(config.host.order, config.paths.order_search),
    data: {
      RequestInfo: requestinfo,
      tenantId: tenantId,
      criteria: {
        tenantId: tenantId,
        ...(orderId &&
          (isOrderNumber ? { orderNumber: orderId } : { id: orderId })),
        ...(status && { status: status }),
        ...(filingNumber && { filingNumber: filingNumber }),
        ...(orderType && { orderType: orderType }),
        ...(courtId && { courtId: courtId }),
      },
    },
  });
}

async function search_order_v2(tenantId, requestinfo, criteria, pagination) {
  return await axios({
    method: "post",
    url: URL.resolve(config.host.order, config.paths.order_search),
    data: {
      RequestInfo: requestinfo,
      tenantId: tenantId,
      criteria,
      pagination,
    },
  });
}

async function search_evidence_v2(tenantId, requestinfo, criteria, pagination) {
  return await axios({
    method: "post",
    url: URL.resolve(config.host.evidence, config.paths.evidence_search),
    data: {
      RequestInfo: requestinfo,
      tenantId: tenantId,
      criteria,
      pagination,
    },
  });
}

async function search_hearing(tenantId, cnrNumber, requestinfo, courtId) {
  return await axios({
    method: "post",
    url: URL.resolve(config.host.hearing, config.paths.hearing_search),
    data: {
      RequestInfo: requestinfo,
      criteria: {
        tenantId: tenantId,
        cnrNumber: cnrNumber,
        ...(courtId && { courtId: courtId }),
      },
      pagination: {
        limit: 10,
        offset: 0,
        sortBy: "createdTime",
        order: "desc",
      },
    },
  });
}

async function search_mdms(
  uniqueIdentifier,
  schemaCode,
  tenantID,
  requestInfo
) {
  return await axios({
    method: "post",
    url: URL.resolve(config.host.mdms, config.paths.mdms_search),
    data: {
      RequestInfo: requestInfo,
      MdmsCriteria: {
        tenantId: tenantID,
        schemaCode: schemaCode,
        limit: 100,
        ...(uniqueIdentifier && { uniqueIdentifiers: [uniqueIdentifier] }),
      },
    },
  });
}

async function search_hrms(tenantId, employeeTypes, courtRooms, requestinfo) {
  const params = {
    tenantId: tenantId,
    employeetypes: employeeTypes,
    courtrooms: courtRooms,
    isActive: true,
    limit: 10,
    offset: 0,
  };

  return await axios({
    method: "post",
    url: URL.resolve(config.host.hrms, config.paths.hrms_search),
    data: {
      RequestInfo: requestinfo,
    },
    params,
  });
}

async function search_individual(tenantId, individualId, requestinfo) {
  const params = {
    tenantId: tenantId,
    limit: 10,
    offset: 0,
  };

  return await axios({
    method: "post",
    url: URL.resolve(config.host.individual, config.paths.individual_search),
    data: {
      RequestInfo: requestinfo,
      Individual: {
        individualId: individualId,
      },
    },
    params,
  });
}

async function search_advocate(tenantId, individualId, requestinfo) {
  const params = {
    tenantId: tenantId,
    limit: 10,
    offset: 0,
  };

  return await axios({
    method: "post",
    url: URL.resolve(config.host.advocate, config.paths.advocate_search),
    data: {
      RequestInfo: requestinfo,
      criteria: [
        {
          individualId: individualId,
        },
      ],
    },
    params,
  });
}

async function search_individual_uuid(tenantId, userUuid, requestinfo) {
  const params = {
    tenantId: tenantId,
    limit: 10,
    offset: 0,
  };

  return await axios({
    method: "post",
    url: URL.resolve(config.host.individual, config.paths.individual_search),
    data: {
      RequestInfo: requestinfo,
      Individual: {
        userUuid: [userUuid],
      },
    },
    params,
  });
}

async function search_application(
  tenantId,
  applicationId,
  requestinfo,
  courtId,
  filingNumber
) {
  return await axios({
    method: "post",
    url: URL.resolve(config.host.application, config.paths.application_search),
    data: {
      RequestInfo: requestinfo,
      tenantId: tenantId,
      criteria: {
        tenantId: tenantId,
        applicationNumber: applicationId,
        ...(filingNumber && { filingNumber: filingNumber }),
        ...(courtId && { courtId: courtId }),
      },
    },
  });
}

async function search_application_v2(
  tenantId,
  requestinfo,
  criteria,
  pagination
) {
  return await axios({
    method: "post",
    url: URL.resolve(config.host.application, config.paths.application_search),
    data: {
      RequestInfo: requestinfo,
      tenantId: tenantId,
      criteria,
      pagination,
    },
  });
}

async function search_sunbirdrc_credential_service(
  tenantId,
  code,
  uuid,
  requestinfo
) {
  return await axios({
    method: "post",
    url: URL.resolve(
      config.host.sunbirdrc_credential_service,
      config.paths.sunbirdrc_credential_service_search
    ),
    data: {
      RequestInfo: requestinfo,
      tenantId: tenantId,
      code: code,
      uuid: uuid,
    },
  });
}

async function create_pdf(tenantId, key, data, requestinfo) {
  return await axios({
    responseType: "stream",
    method: "post",
    url: URL.resolve(config.host.pdf, config.paths.pdf_create),
    data: Object.assign(requestinfo, data),
    params: {
      tenantId: tenantId,
      key: key,
    },
  });
}

async function create_pdf_v2(tenantId, key, data, requestinfo) {
  return await axios({
    responseType: "arraybuffer",
    method: "post",
    url: URL.resolve(config.host.pdf, config.paths.pdf_create),
    data: Object.assign(requestinfo, data),
    params: {
      tenantId: tenantId,
      key: key,
    },
  });
}

async function search_pdf(tenantId, fileStoreId, requestInfo) {
  const apiUrl = URL.resolve(
    config.host.filestore,
    config.paths.filestore_create + "/url"
  );
  const response = await axios.get(apiUrl, {
    headers: {
      "Content-Type": "application/json",
      "auth-token": requestInfo?.authToken || auth_token,
      tenantId: tenantId, // including tenantId as a header
    },
    params: {
      tenantId: tenantId,
      fileStoreIds: fileStoreId,
    },
  });

  return response;
}

async function search_pdf_v2(tenantId, fileStoreId, requestInfo) {
  const apiUrl = URL.resolve(
    config.host.filestore,
    config.paths.filestore_search_id
  );
  const response = await axios.get(apiUrl, {
    headers: {
      "auth-token": requestInfo?.authToken || auth_token,
    },
    params: {
      tenantId: tenantId,
      fileStoreId: fileStoreId,
    },
    responseType: "arraybuffer",
  });

  return response;
}

async function create_file(filePath, tenantId, module, tag) {
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File does not exist at path: ${filePath}`);
    return;
  }

  const form = new FormData();
  form.append("file", fs.createReadStream(filePath));
  form.append("tenantId", tenantId);
  form.append("module", module);
  form.append("tag", tag);

  // Prepare URL for the request
  const url = `${config.host.filestore}${config.paths.filestore_create}`;
  const response = await axios.post(url, form, {
    headers: {
      ...form.getHeaders(), // Adds the required Content-Type header for multipart/form-data
      "auth-token": auth_token,
      tenantId,
    },
    maxContentLength: Infinity, // Optional, in case the file size is large
    maxBodyLength: Infinity, // Optional, in case the file size is large
  });
  return response;
}

async function create_file_v2({
  filePath,
  tenantId,
  module,
  form,
  requestInfo,
}) {
  if (!form) {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`Error: File does not exist at path: ${filePath}`);
      return;
    }

    form = new FormData();
    form.append("file", fs.createReadStream(filePath));
    form.append("tenantId", tenantId);
    form.append("module", module);
  }

  // Prepare URL for the request
  const apiUrl = URL.resolve(
    config.host.filestore,
    config.paths.filestore_create
  );
  const response = await axios.post(apiUrl, form, {
    headers: {
      ...form.getHeaders(), // Adds the required Content-Type header for multipart/form-data
      "auth-token": requestInfo.authToken || auth_token,
      tenantId,
    },
    maxContentLength: Infinity, // Optional, in case the file size is large
    maxBodyLength: Infinity, // Optional, in case the file size is large
  });
  return response;
}

module.exports = create_file;

async function search_message(tenantId, module, locale, requestinfo) {
  return await axios({
    responseType: "json",
    method: "post",
    url: URL.resolve(config.host.localization, config.paths.message_search),
    data: Object.assign(requestinfo),
    params: {
      tenantId: tenantId,
      module: module,
      locale: locale,
    },
  });
}

async function bulk_hearing_reschedule(tenantId, BulkReschedule, requestinfo) {
  return await axios({
    method: "post",
    url: URL.resolve(config.host.hearing, config.paths.hearing_bulk_reschedule),
    data: {
      RequestInfo: requestinfo,
      tenantId: tenantId,
      BulkReschedule: BulkReschedule,
    },
  });
}

async function search_multiple_cases(criteria, tenantId, requestinfo) {
  try {
    return await axios({
      method: "post",
      url: URL.resolve(config.host.case, config.paths.case_search),
      data: {
        RequestInfo: requestinfo,
        tenantId: tenantId,
        criteria: criteria,
      },
    });
  } catch (error) {
    logger.error(`Error in ${config.paths.case_search}: ${error.message}`);
    throw error;
  }
}

async function search_bailBond(tenantId, bailBondId, requestinfo) {
  return await axios({
    method: "post",
    url: URL.resolve(config.host.bailBond, config.paths.bail_bond_search),
    data: {
      RequestInfo: requestinfo,
      tenantId: tenantId,
      criteria: {
        tenantId: tenantId,
        bailId: bailBondId,
      },
    },
  });
}

async function search_bailBond_v2(tenantId, requestinfo, criteria, pagination) {
  try {
    return await axios({
      method: "post",
      url: URL.resolve(config.host.bailBond, config.paths.bail_bond_search),
      data: {
        RequestInfo: requestinfo,
        criteria,
        pagination,
        tenantId,
      },
    });
  } catch (error) {
    logger.error(`Error in ${config.paths.task_search}: ${error.message}`);
    throw error;
  }
}

async function search_task_mangement(
  tenantId,
  requestinfo,
  criteria,
  pagination
) {
  try {
    return await axios({
      method: "post",
      url: URL.resolve(
        config.host.taskMangement,
        config.paths.task_management_search
      ),
      data: {
        RequestInfo: requestinfo,
        criteria,
        pagination,
        tenantId,
      },
    });
  } catch (error) {
    logger.error(
      `Error in ${config.paths.task_management_search}: ${error.message}`
    );
    throw error;
  }
}

async function search_digitalizedDocuments(
  tenantId,
  requestinfo,
  criteria,
  pagination
) {
  try {
    return await axios({
      method: "post",
      url: URL.resolve(
        config.host.digitisation,
        config.paths.digitalized_documents_search
      ),
      data: {
        RequestInfo: requestinfo,
        criteria,
        // pagination,
        tenantId,
      },
    });
  } catch (error) {
    logger.error(
      `Error in ${config.paths.digitalized_documents_search}: ${error.message}`
    );
    throw error;
  }
}

async function search_templateConfiguration(
  tenantId,
  requestinfo,
  criteria,
  pagination
) {
  try {
    return await axios({
      method: "post",
      url: URL.resolve(
        config.host.templateConfiguration,
        config.paths.template_configuration_search
      ),
      data: {
        RequestInfo: requestinfo,
        criteria,
        // pagination,
        tenantId,
      },
    });
  } catch (error) {
    logger.error(
      `Error in ${config.paths.template_configuration_search}: ${error.message}`
    );
    throw error;
  }
}

module.exports = {
  pool,
  create_pdf,
  create_pdf_v2,
  search_hrms,
  search_case,
  search_case_v2,
  search_order,
  search_mdms,
  search_individual,
  search_hearing,
  search_sunbirdrc_credential_service,
  search_individual_uuid,
  search_application,
  search_advocate,
  search_message,
  create_file,
  create_file_v2,
  search_pdf,
  search_pdf_v2,
  bulk_hearing_reschedule,
  search_multiple_cases,
  search_task,
  search_table_task,
  search_task_v2,
  search_application_v2,
  search_order_v2,
  search_evidence_v2,
  search_bailBond,
  search_bailBond_v2,
  search_task_mangement,
  search_digitalizedDocuments,
  search_templateConfiguration,
};
