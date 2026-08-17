import React, { useMemo } from "react";
import { useTable, useSortBy, usePagination, useExpanded, useGlobalFilter } from "react-table";
import { Button, Select, Input } from "antd";
import {
  LeftOutlined,
  DoubleLeftOutlined,
  RightOutlined,
  DoubleRightOutlined,
  RightOutlined as ExpandRightIcon,
  DownOutlined as ExpandDownIcon,
  SearchOutlined,
} from "@ant-design/icons";
import CardLayout from "./CardLayout";

interface TableProps {
  columns: any[];
  data: any[];
  pageSize?: number;
  isPaginated?: boolean;
  expandable?: boolean;
}

export const Table: React.FC<TableProps> = ({
  columns: initialColumns,
  data: initialData,
  pageSize = 10,
  isPaginated = true,
  expandable = false,
}) => {
  const columns = useMemo(() => initialColumns, [initialColumns]);
  const data = useMemo(() => initialData, [initialData]);

  // Hook config builder - useExpanded must be before usePagination
  const hooks: any[] = [useGlobalFilter, useSortBy];
  if (expandable) {
    hooks.push(useExpanded);
  }
  if (isPaginated) {
    hooks.push(usePagination);
  }

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    // Pagination & rows
    page,
    rows,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    setGlobalFilter,
    state: { pageIndex, pageSize: statePageSize, globalFilter },
  } = useTable(
    {
      columns,
      data,
      initialState: { pageSize },
      getSubRows: (row: any) => row.children || row.subRows || [],
    } as any,
    ...hooks,
  ) as any;

  // Use either paginated rows (page) or all rows
  const displayRows = isPaginated ? page : rows;

  return (
    <div className="w-full">
      {/* Top Header: Search & Pagination */}
      <CardLayout className="p-4 rounded-xl mb-4">

        <div className="flex items-center justify-between">
          {/* Search Input (Left) */}
          <div className="flex items-center space-x-2">
            <strong className="text-sm font-semibold text-gray-700">Search:</strong>
            <Input
              placeholder="Search records..."
              value={globalFilter || ""}
              onChange={(e) => setGlobalFilter(e.target.value || undefined)}
              style={{ width: "260px", height: "36px", borderRadius: "6px" }}
              prefix={<SearchOutlined style={{ color: "var(--color-mute)" }} />}
              allowClear
            />
          </div>

          {isPaginated && (
            <div className="flex items-center space-x-4">
              <span className="text-xs text-gray-500">
                Page <strong className="text-gray-700">{pageIndex + 1}</strong> of{" "}
                <strong className="text-gray-700">{pageOptions.length || 1}</strong>
              </span>
              <Select
                size="middle"
                value={statePageSize}
                onChange={(val) => setPageSize(val)}
                style={{ width: "110px" }}
                options={[
                  { value: 5, label: "Show 5" },
                  { value: 10, label: "Show 10" },
                  { value: 20, label: "Show 20" },
                  { value: 50, label: "Show 50" },
                ]}
              />
              <div className="flex items-center space-x-1">
                <Button
                  size="middle"
                  onClick={() => gotoPage(0)}
                  disabled={!canPreviousPage}
                  icon={<DoubleLeftOutlined />}
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                />
                <Button
                  size="middle"
                  onClick={() => previousPage()}
                  disabled={!canPreviousPage}
                  icon={<LeftOutlined />}
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                />
                <Button
                  size="middle"
                  onClick={() => nextPage()}
                  disabled={!canNextPage}
                  icon={<RightOutlined />}
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                />
                <Button
                  size="middle"
                  onClick={() => gotoPage(pageCount - 1)}
                  disabled={!canNextPage}
                  icon={<DoubleRightOutlined />}
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                />
              </div>
            </div>
          )}
        </div>

      </CardLayout>
      {/* Scrollable container for table */}
      <div className="overflow-x-auto overflow-y-auto -my-2 mt-4 -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block w-full sm:px-6 lg:px-8">
          <div className="shadow overflow-hidden sm:rounded-lg border">
            <div
              className="overflow-x-auto overflow-y-auto custom-scroll"
              style={{
                maxHeight: "65vh", // Vertical scroll limit
                maxWidth: "100%", // Ensure container doesn’t exceed parent width
              }}
            >
              <table
                {...getTableProps()}
                className="w-full border-collapse divide-y divide-gray-200"
              >
                <thead className="bg-[#199B90] sticky -top-0.5 z-10">
                  {headerGroups.map((headerGroup: any, idx: number) => (
                    <tr {...headerGroup.getHeaderGroupProps()} key={idx}>
                      {/* <th className="px-2 border-b border-r border-white/15 py-3 text-center text-sm font-semibold text-white uppercase tracking-wider w-[60px]">
                        Sr. No.
                      </th> */}
                      {headerGroup.headers.map(
                        (column: any, idxCol: number) => (
                          <th
                            scope="col"
                            key={idxCol}
                            className="px-2 border-b border-r border-white/15 py-3 text-center text-sm font-semibold text-white uppercase tracking-wider min-w-[150px]"
                            {...column.getHeaderProps(
                              column.getSortByToggleProps(),
                            )}
                          >
                            <span className="cursor-pointer select-none">
                              {column.render("Header")}
                              <span>
                                {column.isSorted
                                  ? column.isSortedDesc
                                    ? " ▼"
                                    : " ▲"
                                  : ""}
                              </span>
                            </span>
                          </th>
                        ),
                      )}
                    </tr>
                  ))}
                </thead>
                <tbody
                  {...getTableBodyProps()}
                  className="bg-white divide-y divide-gray-200"
                >
                  {displayRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-4 py-8 text-center text-gray-500 text-base font-medium border"
                      >
                        Oops! Data not found.
                      </td>
                    </tr>
                  ) : (
                    displayRows.map((row: any, i: number) => {
                      prepareRow(row);
                      return (
                        <tr
                          {...row.getRowProps()}
                          key={i}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          {/* <td
                            className="px-2 py-4 border text-sm text-center w-[60px]"
                            style={{ verticalAlign: "top" }}
                          >
                            {isPaginated
                              ? pageIndex * statePageSize + i + 1
                              : i + 1}
                          </td> */}
                          {row.cells.map((cell: any, index: number) => (
                            <td
                              {...cell.getCellProps()}
                              className="px-2 py-2 border text-sm min-w-[150px]"
                              style={{
                                verticalAlign: "top",
                                paddingLeft:
                                  expandable && index === 0
                                    ? `${row.depth * 1.5 + 0.5}rem`
                                    : "0.5rem",
                              }}
                              key={index}
                            >
                              <div className="flex items-center space-x-2">
                                {expandable && index === 0 && row.canExpand ? (
                                  <span
                                    {...row.getToggleRowExpandedProps()}
                                    className="cursor-pointer text-gray-400 hover:text-blue-500 flex items-center justify-center w-4 h-4 mr-1"
                                  >
                                    {row.isExpanded ? (
                                      <ExpandDownIcon
                                        style={{ fontSize: "10px" }}
                                      />
                                    ) : (
                                      <ExpandRightIcon
                                        style={{ fontSize: "10px" }}
                                      />
                                    )}
                                  </span>
                                ) : expandable && index === 0 ? (
                                  <span className="w-4 mr-1" />
                                ) : null}
                                <span>{cell.render("Cell")}</span>
                              </div>
                            </td>
                          ))}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
