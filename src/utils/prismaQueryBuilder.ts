interface QueryString {
  [key: string]: any;
  page?: string | number;
  sort?: string;
  limit?: string | number;
  fields?: string;
}

interface PrismaQueryOptions {
  where?: any;
  orderBy?: any;
  select?: any;
  skip?: number;
  take?: number;
}

interface QueryBuilderConfig {
  defaultSort?: any;
}

export class PrismaQueryBuilder {
  private queryString: QueryString;
  private prismaOptions: PrismaQueryOptions = {};
  private config: QueryBuilderConfig;

  constructor(queryString: QueryString, config?: QueryBuilderConfig) {
    this.queryString = queryString;
    this.config = config || {
      defaultSort: { role: { name: "asc" } },
    };
  }

  filter(): this {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    const where: any = {};

    Object.keys(queryObj).forEach((key) => {
      const value = queryObj[key];

      // Handle array of values (multiple conditions for same field)
      if (Array.isArray(value)) {
        // For arrays, we need to combine conditions with AND
        const conditions = value.map((val) => this.buildCondition(key, val));
        where.AND = where.AND ? [...where.AND, ...conditions] : conditions;
      } else {
        const condition = this.buildCondition(key, value);
        Object.assign(where, condition);
      }
    });

    this.prismaOptions.where = where;
    return this;
  }

  private buildCondition(key: string, value: any): any {
    // Handle nested fields (e.g., role.name)
    if (key.includes(".")) {
      const parts = key.split(".");
      let condition: any = {};
      let current = condition;

      // Build nested object structure
      for (let i = 0; i < parts.length - 1; i++) {
        current[parts[i]] = {};
        current = current[parts[i]];
      }

      // Set the final condition for the nested field
      const finalKey = parts[parts.length - 1];
      const finalValue = this.parseValue(value);

      // Check if it's a string search
      if (
        typeof finalValue === "string" &&
        !value.includes("gte:") &&
        !value.includes("gt:") &&
        !value.includes("lte:") &&
        !value.includes("lt:")
      ) {
        current[finalKey] = { contains: finalValue, mode: "insensitive" };
      } else {
        current[finalKey] = finalValue;
      }

      return condition;
    }

    // Handle comparison operators (gte, gt, lte, lt)
    if (typeof value === "string") {
      const gteMatch = value.match(/^gte:(.+)$/);
      const gtMatch = value.match(/^gt:(.+)$/);
      const lteMatch = value.match(/^lte:(.+)$/);
      const ltMatch = value.match(/^lt:(.+)$/);

      if (gteMatch || gtMatch || lteMatch || ltMatch) {
        const operatorValue = (gteMatch || gtMatch || lteMatch || ltMatch)![1];

        // Try to parse as date first
        const parsedDate = new Date(operatorValue);
        const finalValue = !isNaN(parsedDate.getTime())
          ? parsedDate
          : isNaN(Number(operatorValue))
          ? operatorValue
          : Number(operatorValue);

        if (gteMatch) return { [key]: { gte: finalValue } };
        if (gtMatch) return { [key]: { gt: finalValue } };
        if (lteMatch) return { [key]: { lte: finalValue } };
        if (ltMatch) return { [key]: { lt: finalValue } };
      }

      // Handle boolean values
      if (value === "true" || value === "false") {
        return { [key]: value === "true" };
      }

      // Handle multiple values (OR condition) - comma-separated
      if (value.includes(",")) {
        const values = value.split(",").map((v: string) => v.trim());
        return {
          OR: values.map((val: string) => ({
            [key]: { contains: val, mode: "insensitive" },
          })),
        };
      }

      // Single value - String contains (case-insensitive)
      return {
        [key]: { contains: value, mode: "insensitive" },
      };
    }

    // Direct equality for non-string values
    return { [key]: value };
  }

  private parseValue(value: any): any {
    // Handle boolean strings
    if (value === "true") return true;
    if (value === "false") return false;

    // Handle numbers
    if (typeof value === "string" && !isNaN(Number(value))) {
      return Number(value);
    }

    return value;
  }

  sort(): this {
    if (this.queryString.sort) {
      const sortFields = (this.queryString.sort as string).split(",");
      const orderBy: any[] = [];

      sortFields.forEach((field) => {
        const isDescending = field.startsWith("-");
        const fieldName = isDescending ? field.substring(1) : field;

        // Handle nested fields (e.g., role.name)
        if (fieldName.includes(".")) {
          const parts = fieldName.split(".");
          let sortObj: any = {};
          let current = sortObj;

          // Build nested object structure
          for (let i = 0; i < parts.length - 1; i++) {
            current[parts[i]] = {};
            current = current[parts[i]];
          }

          // Set the final sort direction
          current[parts[parts.length - 1]] = isDescending ? "desc" : "asc";

          orderBy.push(sortObj);
        } else {
          // Regular field sorting
          orderBy.push({
            [fieldName]: isDescending ? "desc" : "asc",
          });
        }
      });

      this.prismaOptions.orderBy = orderBy;
    } else {
      // Use default sort from config
      this.prismaOptions.orderBy = this.config.defaultSort;
    }

    return this;
  }

  limitFields(): this {
    if (this.queryString.fields) {
      const fields = (this.queryString.fields as string).split(",");
      const select: any = {};

      fields.forEach((field) => {
        select[field] = true;
      });

      // Always include id for proper functioning
      if (!select.id) {
        select.id = true;
      }

      // If role fields are requested, include the role relation
      if (fields.some((f) => f.startsWith("role"))) {
        select.role = true;
      }

      this.prismaOptions.select = select;
    } else {
      // Default: include role relation
      this.prismaOptions.select = undefined; // Will return all fields
    }

    return this;
  }

  paginate(): this {
    const page = Number(this.queryString.page) || 1;
    const limit = Number(this.queryString.limit) || 100;
    const skip = (page - 1) * limit;

    this.prismaOptions.skip = skip;
    this.prismaOptions.take = limit;

    return this;
  }

  getQuery(): PrismaQueryOptions {
    return this.prismaOptions;
  }

  getPaginationParams() {
    const page = Number(this.queryString.page) || 1;
    const limit = Number(this.queryString.limit) || 100;

    return { page, limit };
  }
}
