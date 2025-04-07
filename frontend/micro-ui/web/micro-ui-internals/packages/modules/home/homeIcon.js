import React from "react";

const InboxIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22 8.98V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4H14.1C14.04 4.32 14 4.66 14 5C14 6.48 14.65 7.79 15.67 8.71L12 11L4 6V8L12 13L17.3 9.68C17.84 9.88 18.4 10 19 10C20.13 10 21.16 9.61 22 8.98ZM16 5C16 6.66 17.34 8 19 8C20.66 8 22 6.66 22 5C22 3.34 20.66 2 19 2C17.34 2 16 3.34 16 5Z"
      fill="#3D3C3C"
    />
  </svg>
);

const DocumentIcon = ({ stroke = "#3D3C3C" }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_7437_113106)">
      <path
        d="M14 2H6C4.9 2 4.01 2.9 4.01 4L4 20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z"
        fill={stroke}
      />
    </g>
    <defs>
      <clipPath id="clip0_7437_113106">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const CalenderIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_2716_32245)">
      <path
        d="M20 3H19V1H17V3H7V1H5V3H4C2.9 3 2 3.9 2 5V21C2 22.1 2.9 23 4 23H20C21.1 23 22 22.1 22 21V5C22 3.9 21.1 3 20 3ZM20 21H4V8H20V21Z"
        fill="#3D3C3C"
      />
    </g>
    <defs>
      <clipPath id="clip0_2716_32245">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const CaseDynamicsIcon = ({ stroke = "#007E7E" }) => {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_9909_3200)">
        <path
          d="M3.93428 4.19219C3.84687 4.10487 3.7873 3.99361 3.76309 3.87245C3.73888 3.75129 3.75113 3.62568 3.79828 3.51148C3.84543 3.39728 3.92537 3.29961 4.02801 3.23083C4.13064 3.16204 4.25136 3.12521 4.37491 3.125H15.6249C15.7486 3.1249 15.8695 3.16151 15.9724 3.23017C16.0753 3.29884 16.1555 3.39649 16.2028 3.51076C16.2501 3.62502 16.2625 3.75076 16.2384 3.87207C16.2142 3.99337 16.1546 4.10478 16.0671 4.19219L9.99991 10L3.93428 4.19219Z"
          stroke={stroke}
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M3.93428 15.8078C3.84687 15.8951 3.7873 16.0064 3.76309 16.1276C3.73888 16.2487 3.75113 16.3743 3.79828 16.4885C3.84543 16.6027 3.92537 16.7004 4.02801 16.7692C4.13064 16.838 4.25136 16.8748 4.37491 16.875H15.6249C15.7486 16.8751 15.8695 16.8385 15.9724 16.7698C16.0753 16.7012 16.1555 16.6035 16.2028 16.4892C16.2501 16.375 16.2625 16.2492 16.2384 16.1279C16.2142 16.0066 16.1546 15.8952 16.0671 15.8078L9.99991 10L3.93428 15.8078Z"
          stroke={stroke}
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path d="M10 10V13.125" stroke={stroke} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M13.9163 6.25H6.0835" stroke={stroke} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </g>
      <defs>
        <clipPath id="clip0_9909_3200">
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

const MailBoxIcon = ({ stroke = "#77787B" }) => {
  return (
    <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_9917_3658)">
        <path d="M6 10H3.5" stroke={stroke} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M10 9.5V2H12" stroke={stroke} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path
          d="M14.5 11.5V7.75C14.5 6.88805 14.1576 6.0614 13.5481 5.4519C12.9386 4.84241 12.112 4.5 11.25 4.5H4.75C5.61195 4.5 6.4386 4.84241 7.0481 5.4519C7.65759 6.0614 8 6.88805 8 7.75V12H14C14.1326 12 14.2598 11.9473 14.3536 11.8536C14.4473 11.7598 14.5 11.6326 14.5 11.5Z"
          stroke={stroke}
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M8 14.5V12H2C1.86739 12 1.74021 11.9473 1.64645 11.8536C1.55268 11.7598 1.5 11.6326 1.5 11.5V7.75C1.5 6.88805 1.84241 6.0614 2.4519 5.4519C3.0614 4.84241 3.88805 4.5 4.75 4.5"
          stroke={stroke}
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_9917_3658">
          <rect width="16" height="16" fill="white" transform="translate(0 0.5)" />
        </clipPath>
      </defs>
    </svg>
  );
};

const ThreeUserIcon = ({ stroke = "#77787B" }) => {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_9917_3644)">
        <path
          d="M15 9.375C15.7278 9.37445 16.4457 9.54364 17.0967 9.86913C17.7477 10.1946 18.3138 10.6674 18.75 11.25"
          stroke={stroke}
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M1.25 11.25C1.68625 10.6674 2.25234 10.1946 2.90331 9.86913C3.55429 9.54364 4.27219 9.37445 5 9.375"
          stroke={stroke}
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M10 14.375C11.7259 14.375 13.125 12.9759 13.125 11.25C13.125 9.52411 11.7259 8.125 10 8.125C8.27411 8.125 6.875 9.52411 6.875 11.25C6.875 12.9759 8.27411 14.375 10 14.375Z"
          stroke={stroke}
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M5.625 16.875C6.07366 16.1136 6.71325 15.4825 7.48054 15.0441C8.24784 14.6056 9.11627 14.375 10 14.375C10.8837 14.375 11.7522 14.6056 12.5195 15.0441C13.2867 15.4825 13.9263 16.1136 14.375 16.875"
          stroke={stroke}
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M12.5781 6.25C12.695 5.79732 12.9365 5.38648 13.2751 5.06414C13.6138 4.74181 14.036 4.5209 14.4939 4.42649C14.9518 4.33209 15.427 4.36798 15.8656 4.53009C16.3041 4.6922 16.6884 4.97403 16.9748 5.34357C17.2612 5.71311 17.4382 6.15556 17.4858 6.62067C17.5333 7.08577 17.4495 7.5549 17.2439 7.97476C17.0382 8.39462 16.7189 8.7484 16.3223 8.99592C15.9256 9.24343 15.4675 9.37476 15 9.375"
          stroke={stroke}
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M4.99996 9.375C4.53243 9.37476 4.07433 9.24343 3.6777 8.99592C3.28106 8.7484 2.96178 8.39462 2.75611 7.97476C2.55044 7.5549 2.46663 7.08577 2.51419 6.62067C2.56176 6.15556 2.73879 5.71311 3.02518 5.34357C3.31158 4.97403 3.69586 4.6922 4.13439 4.53009C4.57292 4.36798 5.04811 4.33209 5.50601 4.42649C5.96392 4.5209 6.38617 4.74181 6.72482 5.06414C7.06347 5.38648 7.30495 5.79732 7.42184 6.25"
          stroke={stroke}
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_9917_3644">
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

const CollapseIcon = () => {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.5 2.5L5.5 8L10.5 13.5" stroke="#0B0C0C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const ExpandIcon = () => {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.5 2.5L10.5 8L5.5 13.5" stroke="#0B0C0C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const DownloadIcon = () => {
  return (
    <svg width="12" height="15" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.8337 5H8.50033V0H3.50033V5H0.166992L6.00033 10.8333L11.8337 5ZM0.166992 12.5V14.1667H11.8337V12.5H0.166992Z" fill="#0B0C0C" />
    </svg>
  );
};

const FilterIcon = () => {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2.83345 3.73935C4.18012 5.46602 6.66679 8.66602 6.66679 8.66602V12.666C6.66679 13.0327 6.96678 13.3327 7.33345 13.3327H8.66679C9.03345 13.3327 9.33345 13.0327 9.33345 12.666V8.66602C9.33345 8.66602 11.8135 5.46602 13.1601 3.73935C13.5001 3.29935 13.1868 2.66602 12.6335 2.66602H3.36012C2.80679 2.66602 2.49345 3.29935 2.83345 3.73935Z"
        fill="#77787B"
      />
    </svg>
  );
};

const DateIcon = () => {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_24000_15)">
        <path
          d="M6 7.33398H4.66667V8.66732H6V7.33398ZM8.66667 7.33398H7.33333V8.66732H8.66667V7.33398ZM11.3333 7.33398H10V8.66732H11.3333V7.33398ZM12.6667 2.66732H12V1.33398H10.6667V2.66732H5.33333V1.33398H4V2.66732H3.33333C2.59333 2.66732 2.00667 3.26732 2.00667 4.00065L2 13.334C2 14.0673 2.59333 14.6673 3.33333 14.6673H12.6667C13.4 14.6673 14 14.0673 14 13.334V4.00065C14 3.26732 13.4 2.66732 12.6667 2.66732ZM12.6667 13.334H3.33333V6.00065H12.6667V13.334Z"
          fill="#77787B"
        />
      </g>
      <defs>
        <clipPath id="clip0_24000_15">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export {
  InboxIcon,
  DocumentIcon,
  CalenderIcon,
  MailBoxIcon,
  CaseDynamicsIcon,
  ThreeUserIcon,
  ExpandIcon,
  CollapseIcon,
  DownloadIcon,
  FilterIcon,
  DateIcon,
};
