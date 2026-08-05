'use client';

import React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';

import { ChevronDown, PlusCircle, RefreshCcw } from 'lucide-react';
import { camelToTitle } from '@/core/utils/helper.utils';
import { TableMenubar } from './tablemenubar';
import { EmptyDemo } from './emptycomp';
import { GridSkeleton } from '@/core/utils/loader.util';

export default function DataTable({
  columns,
  data,
  searchKey,
  filters = [],
  exports = [],
  customs = [],
  reset = () => { },
  create = {
    provision: false,
    permission: false,
    label: '',
    action: () => { },
  },

  fallback = {
    title: 'No data available',
    description: 'There’s nothing to show here right now.',
    buttons: [],
  },

  loading = false,

  manualPagination = false,
  page,
  pageCount = 1,
  totalRows = 0,

  onPaginationChange,
  onSortChange,
}) {
  const localPageIndex = React.useState(0)[0];



  const [pageSize, setPageSize] = React.useState(10);
  const [sorting, setSorting] = React.useState([]);
  const skipPaginationRef = React.useRef(false);
  const searchTimeoutRef = React.useRef(null);

  const isServer = manualPagination === true;

  const didMountRef = React.useRef(false);

  const pageIndex = isServer
    ? Math.max(0, (page ?? 1) - 1)
    : localPageIndex;

  React.useEffect(() => {
    if (!isServer || !onPaginationChange) return;

    console.log(didMountRef.current)

    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    if (skipPaginationRef.current) {
      skipPaginationRef.current = false;
      return;
    }

    const nextPage = pageIndex + 1;

    if (page === nextPage) return;


    onPaginationChange({
      page: pageIndex + 1,
      limit: pageSize,
    });
  }, [pageIndex, pageSize]);




  const table = useReactTable({
    data,
    columns,

    state: {
      pagination: { pageIndex, pageSize },
      sorting,
    },

    manualPagination: isServer,
    manualSorting: true,
    pageCount: isServer ? pageCount : undefined,

    onPaginationChange: () => { },

    onSortingChange: setSorting,

    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const menubarConfig = React.useMemo(() => {
    const config = [];

    if (filters?.length) {
      config.push({
        title: 'Filter',
        items: filters.map((f) => ({
          label: f.label,
          action: () =>
            f.action({
              page: pageIndex + 1,
              limit: pageSize,
            }),
        })),
      });
    }

    if (customs?.length) {
      customs.forEach((c) => {
        config.push({
          title: c.title,
          items: c.filters.map((f) => ({
            label: f.label,
            action: f.action,
          })),
        });
      });
    }

    if (exports?.length) {
      config.push({
        title: 'Export',
        items: exports.map((e) => ({
          label: e.label,
          action: () => e.action(),
        })),
      });
    }

    return config;
  }, [filters, exports, customs]);

  return (
    <div className="w-full">

      {searchKey && (
        <div
          className="flex flex-col gap-3 py-4
                md:flex-row md:flex-wrap md:items-center md:justify-between"
        >
          <Input
            placeholder={`Search ${camelToTitle(searchKey)}...`}
            onChange={(e) => {
              const value = e.target.value;

              clearTimeout(searchTimeoutRef.current);

              searchTimeoutRef.current = setTimeout(() => {
                skipPaginationRef.current = true;

                onPaginationChange?.({
                  page: 1,
                  limit: pageSize,
                  search: value || null,
                  __replace: true,
                });
              }, 400);
            }}
            className="max-w-sm w-150"
          />

          {menubarConfig.length > 0 && (
            <TableMenubar
              config={menubarConfig}
              reset={() => {
                skipPaginationRef.current = true;
                setSorting([]);

                reset();
              }}
            />
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              {table.getAllLeafColumns().map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(v) => {
                    column.toggleVisibility(!!v);
                  }}
                >
                  {camelToTitle(column.id) || column.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {create.provision && create.permission && (
            <Button className="flex items-center gap-2" onClick={create.action}>
              <PlusCircle className="w-4 h-4" />
              {create.label}
            </Button>
          )}
          <Button
            className="flex items-center gap-2"
            onClick={(e) => {
              e.preventDefault();
              reset()
            }}
            disabled={loading}
          >
            <RefreshCcw
              className={`w-4 h-4 transition-transform ${loading ? 'animate-spin' : ''
                }`}
            />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>

        </div>
      )}
      {loading ? (
        <GridSkeleton />
      ) : (
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => {
                    const canSort = !!onSortChange && header.column.columnDef.enableSorting;

                    return (
                      <TableHead
                        key={header.id}
                        className={canSort ? 'cursor-pointer select-none' : ''}
                        onClick={() => {
                          if (!canSort) return;
                          skipPaginationRef.current = true;

                          const direction = header.column.getIsSorted() === 'asc' ? 'desc' : 'asc';

                          setSorting([{ id: header.column.id, desc: direction === 'desc' }]);

                          onSortChange({
                            sortBy: header.column.id,
                            order: direction,
                            limit: pageSize,
                            __replace: true,
                          });
                        }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex justify-center items-center">
                      <EmptyDemo {...fallback} />
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>)}

      {}
      {}
      {}
      {!loading && (<div className="flex items-center justify-between py-4">
        {isServer ? (
          <div className="text-sm text-muted-foreground">
            Page {pageIndex + 1} of {pageCount} • Total {totalRows}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Page {pageIndex + 1} • Showing {table.getRowModel().rows.length} rows
          </div>
        )}

        <div className="flex items-center gap-3">
          {}
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              const nextLimit = Number(value);


              setPageSize(nextLimit);


              onPaginationChange?.({
                page: 1,
                limit: nextLimit,
                __replace: true,
              });
            }}
          >

            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Page size" />
            </SelectTrigger>

            <SelectContent>
              {[10, 20, 30, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  Show {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {}
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() =>
              onPaginationChange?.({
                page: page - 1,
                limit: pageSize,
              })
            }
          >
            Previous
          </Button>


          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount}
            onClick={() =>
              onPaginationChange?.({
                page: page + 1,
                limit: pageSize,
              })
            }
          >
            Next
          </Button>

        </div>
      </div>)}
    </div>
  );
}
