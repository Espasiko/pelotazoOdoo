declare module 'react-router-dom' {
  import * as React from 'react';

  // BrowserRouter
  export interface BrowserRouterProps {
    basename?: string;
    children?: React.ReactNode;
    window?: Window;
  }
  export const BrowserRouter: React.FC<BrowserRouterProps>;

  // Routes and Route
  export interface RouteProps {
    caseSensitive?: boolean;
    children?: React.ReactNode;
    element?: React.ReactNode | null;
    index?: boolean;
    path?: string;
  }
  export const Routes: React.FC<{ children?: React.ReactNode }>;
  export const Route: React.FC<RouteProps>;

  // Hooks
  export function useParams<Params extends { [K in keyof Params]?: string } = {}>(): Params;
  export function useNavigate(): (to: string, options?: { replace?: boolean; state?: any }) => void;
  export function useLocation(): { pathname: string; search: string; hash: string; state: any };

  // Link
  export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    to: string;
    replace?: boolean;
    state?: any;
  }
  export const Link: React.FC<LinkProps>;

  // Other exports
  export const Navigate: React.FC<{ to: string; replace?: boolean; state?: any }>;
  export const Outlet: React.FC;
}
