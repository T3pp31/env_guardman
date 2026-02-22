/** A single entry in an .env file */
export interface EnvEntry {
  /** Variable name (e.g. "DATABASE_URL") */
  key: string;
  /** Value (e.g. "postgres://...") — empty string means no value */
  value: string;
  /** Preceding comment line (used as description) */
  comment?: string;
  /** Line number in the source file (1-indexed) */
  line: number;
}

/** Result of a diff check between template and actual env file */
export interface CheckResult {
  /** Variables present in template but missing from env file */
  missing: EnvEntry[];
  /** Path to the template file that was checked */
  templatePath: string;
  /** Path to the env file that was checked */
  envPath: string;
}
