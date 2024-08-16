/**
 * These types are use to extend the global types in the program being parsed.
 * It's useful to add types to modules that are not written in TypeScript.
 */

// This allows http/s modules to be imported without TypeScript errors

export default `
declare module 'http://*' {
  const value: any;
  export default value;
}

declare module 'https://*' {
  const value: any;
  export default value;
}
`;
