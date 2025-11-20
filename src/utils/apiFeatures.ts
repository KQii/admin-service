interface QueryString {
  [key: string]: any;
  page?: string | number;
  sort?: string;
  limit?: string | number;
  fields?: string;
}

export class APIFeatures<T> {
  public data: T[];
  private queryString: QueryString;
  private filteredData: T[];

  constructor(data: T[], queryString: QueryString) {
    this.data = data;
    this.filteredData = [...data];
    this.queryString = queryString;
  }

  filter(): this {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Filter data based on query parameters
    if (Object.keys(queryObj).length > 0) {
      this.data = this.data.filter((item: any) => {
        return Object.keys(queryObj).every((key) => {
          const value = queryObj[key];
          const itemValue = item[key];

          // Handle null/undefined
          if (itemValue === null || itemValue === undefined) {
            return false;
          }

          // Handle array of values (multiple query params with same key)
          if (Array.isArray(value)) {
            // Each condition in the array must pass (AND logic for ranges)
            return value.every((val) => this.evaluateCondition(itemValue, val));
          }

          // Handle single value
          return this.evaluateCondition(itemValue, value);
        });
      });
    }

    return this;
  }

  private evaluateCondition(itemValue: any, value: any): boolean {
    // Handle comparison operators
    if (typeof value === "string") {
      // Handle gte, gt, lte, lt operators
      const gteMatch = value.match(/^gte:(.+)$/);
      const gtMatch = value.match(/^gt:(.+)$/);
      const lteMatch = value.match(/^lte:(.+)$/);
      const ltMatch = value.match(/^lt:(.+)$/);

      if (gteMatch || gtMatch || lteMatch || ltMatch) {
        const operatorValue = (gteMatch || gtMatch || lteMatch || ltMatch)![1];

        // Try to parse as date first (ISO string)
        const operatorDate = new Date(operatorValue);
        const itemDate = new Date(itemValue as string);

        if (!isNaN(operatorDate.getTime()) && !isNaN(itemDate.getTime())) {
          // Both are valid dates - compare as dates
          if (gteMatch) return itemDate.getTime() >= operatorDate.getTime();
          if (gtMatch) return itemDate.getTime() > operatorDate.getTime();
          if (lteMatch) return itemDate.getTime() <= operatorDate.getTime();
          if (ltMatch) return itemDate.getTime() < operatorDate.getTime();
        } else {
          // Not dates - compare as numbers
          const numValue = parseFloat(operatorValue);
          if (!isNaN(numValue)) {
            if (gteMatch) return itemValue >= numValue;
            if (gtMatch) return itemValue > numValue;
            if (lteMatch) return itemValue <= numValue;
            if (ltMatch) return itemValue < numValue;
          }
        }
      }

      // Handle multiple values (OR condition) - comma-separated
      if (value.includes(",")) {
        const values = value.split(",").map((v) => v.trim());

        // For strings, check if itemValue contains any of the values
        if (typeof itemValue === "string") {
          return values.some((val) =>
            itemValue.toLowerCase().includes(val.toLowerCase())
          );
        }

        // For non-strings, check exact match with any value
        return values.some((val) => itemValue == val);
      }

      // Single value - String contains (case-insensitive partial match)
      if (typeof itemValue === "string") {
        return itemValue.toLowerCase().includes(value.toLowerCase());
      }
    }

    // Direct equality check for non-string values
    return itemValue === value || itemValue == value;
  }

  sort(): this {
    if (this.queryString.sort) {
      const sortFields = (this.queryString.sort as string).split(",");

      this.data = this.data.sort((a: any, b: any) => {
        for (const field of sortFields) {
          const isDescending = field.startsWith("-");
          const fieldName = isDescending ? field.substring(1) : field;

          const aValue = a[fieldName];
          const bValue = b[fieldName];

          if (aValue !== bValue) {
            if (aValue < bValue) return isDescending ? 1 : -1;
            if (aValue > bValue) return isDescending ? -1 : 1;
          }
        }
        return 0;
      });
    }

    return this;
  }

  limitFields(): this {
    if (this.queryString.fields) {
      const fields = (this.queryString.fields as string).split(",");

      this.data = this.data.map((item: any) => {
        const newItem: any = {};
        fields.forEach((field) => {
          if (item.hasOwnProperty(field)) {
            newItem[field] = item[field];
          }
        });
        return newItem;
      });
    }

    return this;
  }

  paginate(): this {
    const page = Number(this.queryString.page) || 1;
    const limit = Number(this.queryString.limit) || 100;
    const skip = (page - 1) * limit;

    // Save filtered data count before pagination
    this.filteredData = [...this.data];

    this.data = this.data.slice(skip, skip + limit);

    return this;
  }

  getMetadata() {
    const page = Number(this.queryString.page) || 1;
    const limit = Number(this.queryString.limit) || 100;
    const total = this.filteredData.length; // Use filtered count
    const totalPages = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }
}
