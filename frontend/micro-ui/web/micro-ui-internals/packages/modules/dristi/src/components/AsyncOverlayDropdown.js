import React, { useState, useEffect } from "react";
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
    return null; // Or a loading spinner if you prefer
  }

  return <OverlayDropdown {...props} row={row} cutomDropdownItems={dropdownItems} />;
};

export default AsyncOverlayDropdown;
