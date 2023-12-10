export interface GithubToken {
  access_token: string;
  token_type: string;
  scope: string;
}

export interface GitHubUserInfo {
  login: string;
  id: number;
  avatar_url: string;
  url: string;
  html_url: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}
