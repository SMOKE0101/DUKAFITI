
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ResponsiveTableProps {
  headers: string[];
  data: Array<Record<string, any>>;
  mobileCardRenderer?: (item: any, index: number) => React.ReactNode;
  className?: string;
}

const ResponsiveTable = ({ headers, data, mobileCardRenderer, className }: ResponsiveTableProps) => {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <Table className={className}>
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header} className="text-xs sm:text-sm">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={index}>
                {Object.values(item).map((value: any, cellIndex) => (
                  <TableCell key={cellIndex} className="text-xs sm:text-sm">
                    {value}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {data.map((item, index) => (
          <Card key={index} className="p-4">
            <CardContent className="p-0">
              {mobileCardRenderer ? mobileCardRenderer(item, index) : (
                <div className="space-y-2">
                  {Object.entries(item).map(([key, value], entryIndex) => (
                    <div key={entryIndex} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">{headers[entryIndex]}:</span>
                      <span className="text-sm">{value as React.ReactNode}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
};

export default ResponsiveTable;
