export const processDeliveryCourierServiceFormConfig = [
  {
    body: [
      {
        type: "component",
        component: "ProcessCourierService",
        key: "multipleAccusedProcessCourier",
        withoutLabel: true,
        populators: {
          inputs: [
            {
              type: "courierOptions",
              name: "courierServices",
              options: [
                { code: "Registered Post", name: "Registered Post (INR 40) • 10-15 days delivery" },
                { code: "E-Post", name: "E-Post (INR 50) • 3-5 days delivery" },
              ],
            },
          ],
        },
      },
    ],
  },
];

export const processDeliveryCourierServiceConfig = {
  formconfig: processDeliveryCourierServiceFormConfig,
  header: "CS_PROCESS_DELIVER_COURIER_SERVICE_HEADING",
  subtext: "CS_PROCESS_DELIVER_COURIER_SERVICE_SUBTEXT",
  className: "process-courier-service",
};
