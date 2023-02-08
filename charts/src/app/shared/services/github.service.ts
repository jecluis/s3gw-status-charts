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

type GithubLabel = {
  id: number;
  node_id: string;
  url: string;
  name: string;
  description: string;
  color: string;
  default: boolean;
};

@Injectable({
  providedIn: "root",
})
export class GithubService {
  private token?: string;

  public constructor(private http: HttpClient) {
    this.fetchInformation();
  }

  private fetchInformation() {}

  public setToken(token: string) {
    this.token = token;
  }

  public hasToken(): boolean {
    return !!this.token;
  }
}
