import React from "react";

const Header = ({ title }: { title: string }) => {
  return (
    <header>
      <h1 className="text-3xl font-semibold">{title}</h1>
      <div className="my-3 h-px w-full bg-[#EBEDF3]"></div>
    </header>
  );
};

export default Header;
