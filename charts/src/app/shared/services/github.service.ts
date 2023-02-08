// Copyright 2023 SUSE, LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { graphql, GraphQlQueryResponseData } from "@octokit/graphql";
import { BehaviorSubject } from "rxjs";

type GithubProjectItem = {
  fieldValueByName?: {
    name: string;
  };
};

type GithubSearchNode = {
  title: string;
  number: number;
  projectItems: {
    nodes: GithubProjectItem[];
  };
};

type GithubSearchResult = {
  search: {
    issueCount: number;
    nodes: GithubSearchNode[];
  };
};

export type EpicIssueEntry = {
  number: number;
  title: string;
  epic: string;
};

export type IssueByEpicMap = { [id: string]: EpicIssueEntry[] };

export type Epics = {
  epics: string[];
  issuesByEpic: IssueByEpicMap;
};

type GithubIssueLabel = {
  name: string;
  color: string;
};

type GithubIssuesNode = {
  state?: String;
  title: string;
  number: number;
  labels: { nodes: GithubIssueLabel[] };
  milestone?: { title: string };
};

type GithubIssuesResult = {
  search: {
    issueCount: number;
    nodes: GithubIssuesNode[];
  };
};

export type IssueEntry = {
  title: string;
  number: number;
  kind: string;
  area: string[];
};

export type Issues = {
  kinds: string[];
  areas: string[];
  byKind: { [id: string]: IssueEntry[] };
  byArea: { [id: string]: IssueEntry[] };
};

type GithubAllIssuesResult = {
  search: {
    issueCount: number;
    pageInfo: {
      endCursor?: string;
      startCursor?: string;
    };
    nodes: GithubIssuesNode[];
  };
};

export type IssuesByState = {
  open: Issues;
  closed: Issues;
};

@Injectable({
  providedIn: "root",
})
export class GithubService {
  private API_TOKEN_ITEM = "github-api-token";

  private epics: string[] = [];
  private issueByEpic: IssueByEpicMap = {};
  private issues: Issues = {
    kinds: [],
    areas: [],
    byKind: {},
    byArea: {},
  };
  private issuesByState: IssuesByState = {
    open: {
      kinds: [],
      areas: [],
      byKind: {},
      byArea: {},
    },
    closed: {
      kinds: [],
      areas: [],
      byKind: {},
      byArea: {},
    },
  };

  private epicsSubject: BehaviorSubject<Epics> = new BehaviorSubject<Epics>({
    epics: this.epics,
    issuesByEpic: this.issueByEpic,
  });
  private issuesSubject: BehaviorSubject<Issues> = new BehaviorSubject<Issues>(
    this.issues,
  );
  private byStateSubject: BehaviorSubject<IssuesByState> =
    new BehaviorSubject<IssuesByState>(this.issuesByState);

  public constructor(private http: HttpClient) {
    this.fetchInformation();
  }

  private fetchInformation() {
    this.fetchEpicsInformation().then(() => {});
    this.fetchIssuesInformation().then(() => {});
    this.fetchAllIssues().then(() => {});
  }

  private async fetchEpicsInformation() {
    if (!this.hasToken()) {
      return;
    }

    const token = this.getToken();
    console.log("token: ", token);
    const res: GithubSearchResult = await graphql(
      `
        {
          search(
            type: ISSUE
            first: 100
            query: "repo:aquarist-labs/s3gw is:open"
          ) {
            issueCount
            nodes {
              ... on Issue {
                title
                number
                projectItems(first: 100) {
                  nodes {
                    fieldValueByName(name: "Epic") {
                      ... on ProjectV2ItemFieldSingleSelectValue {
                        # field
                        name
                        # nameHTML
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `,
      {
        headers: {
          authorization: `token ${token}`,
        },
      },
    );
    res.search.nodes.forEach((entry: GithubSearchNode) => {
      if (
        entry.projectItems.nodes.length == 0 ||
        !entry.projectItems.nodes[0].fieldValueByName
      ) {
        return;
      }
      const epic = entry.projectItems.nodes[0].fieldValueByName.name;
      if (!this.epics.includes(epic)) {
        this.epics.push(epic);
        this.issueByEpic[epic] = [];
      }
      this.issueByEpic[epic].push({
        number: entry.number,
        title: entry.title,
        epic: epic,
      });
    });
    this.epicsSubject.next({
      epics: this.epics,
      issuesByEpic: this.issueByEpic,
    });
  }

  private async fetchIssuesInformation() {
    if (!this.hasToken()) {
      return;
    }
    const token = this.getToken();
    const res: GithubIssuesResult = await graphql(
      `
        {
          search(
            type: ISSUE
            first: 100
            query: "repo:aquarist-labs/s3gw is:open"
          ) {
            issueCount
            nodes {
              ... on Issue {
                title
                number
                labels(first: 100) {
                  nodes {
                    color
                    name
                  }
                }
                milestone {
                  title
                }
              }
            }
          }
        }
      `,
      {
        headers: {
          authorization: `token ${token}`,
        },
      },
    );
    console.debug(res);

    res.search.nodes.forEach((entry: GithubIssuesNode) => {
      let kind: string = "";
      let areas: string[] = [];

      entry.labels.nodes.forEach((label: GithubIssueLabel) => {
        const label_parts = label.name.split("/");
        if (label_parts.length < 2) {
          return;
        }
        if (label_parts[0] === "kind") {
          kind = label_parts[1];
        } else if (
          label_parts[0] === "area" ||
          label_parts[0] === "component"
        ) {
          areas.push(label_parts[1]);
        }
      });

      if (kind === "" && areas.length === 0) {
        return;
      }

      const issue: IssueEntry = {
        title: entry.title,
        number: entry.number,
        kind: kind,
        area: areas,
      };

      if (kind !== "") {
        if (!this.issues.kinds.includes(kind)) {
          this.issues.kinds.push(kind);
          this.issues.byKind[kind] = [];
        }
        this.issues.byKind[kind].push(issue);
      }

      if (areas.length > 0) {
        areas.forEach((v: string) => {
          if (!this.issues.areas.includes(v)) {
            this.issues.areas.push(v);
            this.issues.byArea[v] = [];
          }
          this.issues.byArea[v].push(issue);
        });
      }
    });
    this.issuesSubject.next(this.issues);
  }

  private async fetchAllIssues() {
    if (!this.hasToken()) {
      return;
    }
    const token = this.getToken();

    const query = `
    query issues($marker: String = null) {
      search(type: ISSUE, first: 100, after: $marker,
             query: "repo:aquarist-labs/s3gw type:issue") {
        issueCount
        pageInfo {
          endCursor
          startCursor
        }
        nodes {
          ... on Issue {
            state
            title
            number
            labels(first: 100) {
              nodes {
                color
                name
              }
            }
            milestone {
              title
            }
          }
        }
      }
    }
    `;

    let done = false;
    let marker: string | null = null;
    do {
      const res: GithubAllIssuesResult = await graphql(query, {
        marker: marker,
        headers: {
          authorization: `token ${token}`,
        },
      });
      if (!res.search.pageInfo.endCursor) {
        done = true;
      } else {
        marker = res.search.pageInfo.endCursor;
      }
      console.debug(res.search.nodes);
      this.handleIssues(res.search.nodes);
    } while (!done);
    this.byStateSubject.next(this.issuesByState);
  }

  private handleIssues(issues: GithubIssuesNode[]) {
    issues.forEach((entry: GithubIssuesNode) => {
      if (!entry.state) {
        console.error("Unexpected stateless issue: ", entry);
        return;
      }

      const isOpen = entry.state.toLowerCase() === "open";
      const target = isOpen
        ? this.issuesByState.open
        : this.issuesByState.closed;

      let kind: string = "";
      let areas: string[] = [];

      entry.labels.nodes.forEach((label: GithubIssueLabel) => {
        const label_parts = label.name.split("/");
        if (label_parts.length < 2) {
          return;
        }
        if (label_parts[0] === "kind") {
          kind = label_parts[1];
        } else if (
          label_parts[0] === "area" ||
          label_parts[0] === "component"
        ) {
          areas.push(label_parts[1]);
        }
      });

      if (kind === "" && areas.length === 0) {
        return;
      }

      const issue: IssueEntry = {
        title: entry.title,
        number: entry.number,
        kind: kind,
        area: areas,
      };

      if (kind !== "") {
        if (!target.kinds.includes(kind)) {
          target.kinds.push(kind);
          target.byKind[kind] = [];
        }
        target.byKind[kind].push(issue);
      }

      if (areas.length > 0) {
        areas.forEach((v: string) => {
          if (!target.areas.includes(v)) {
            target.areas.push(v);
            target.byArea[v] = [];
          }
          target.byArea[v].push(issue);
        });
      }
    });

    console.log(this.issuesByState);
  }

  public setToken(token: string) {
    localStorage.setItem(this.API_TOKEN_ITEM, token);
    this.fetchEpicsInformation();
  }

  public getToken(): string {
    let res = localStorage.getItem(this.API_TOKEN_ITEM);
    console.assert(!!res);
    return res!;
  }

  public hasToken(): boolean {
    let res = localStorage.getItem(this.API_TOKEN_ITEM);
    return !!res;
  }

  public getEpics(): BehaviorSubject<Epics> {
    return this.epicsSubject;
  }

  public getIssues(): BehaviorSubject<Issues> {
    return this.issuesSubject;
  }

  public getIssuesByState(): BehaviorSubject<IssuesByState> {
    return this.byStateSubject;
  }
}
