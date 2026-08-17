import React from "react";

const CardLayout = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const wrapperClasses = `bg-white rounded-lg shadow box-border overflow-hidden ${
    className || ""
  }`;

  return <div className={wrapperClasses}>{children}</div>;
};

export default CardLayout;
