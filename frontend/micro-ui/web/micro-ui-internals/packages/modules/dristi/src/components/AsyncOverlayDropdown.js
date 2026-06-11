import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import OverlayDropdown from "./OverlayDropdown";

const AsyncOverlayDropdown = ({ row, getDropdownItems, ...props }) => {
  const [dropdownItems, setDropdownItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDropdownItems = async () => {
      try {
        const items = await getDropdownItems(row);
        setDropdownItems(items || []);
      } catch (error) {
        console.error("Error fetching dropdown items:", error);
        setDropdownItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDropdownItems();
  }, [row, getDropdownItems]);

  if (isLoading) {
    return null;
  }

  return <OverlayDropdown {...props} row={row} cutomDropdownItems={dropdownItems} />;
};

AsyncOverlayDropdown.propTypes = {
  row: PropTypes.object,
  getDropdownItems: PropTypes.func,
};

export default AsyncOverlayDropdown;
