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

import { Component, OnInit } from "@angular/core";
import { FormControl, Validators } from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { GithubService } from "src/app/shared/services/github.service";

@Component({
  selector: "s3gw-main-layout",
  templateUrl: "./main-layout.component.html",
  styleUrls: ["./main-layout.component.scss"],
})
export class MainLayoutComponent implements OnInit {
  public githubTokenFormControl = new FormControl("", Validators.required);

  public constructor(
    private modalService: NgbModal,
    private ghSvc: GithubService,
  ) {}

  public ngOnInit(): void {}

  public open(content: any) {
    this.modalService.open(content);
  }

  public submitToken() {
    console.log("has token: ", this.githubTokenFormControl.value);
    if (
      !this.githubTokenFormControl.value ||
      this.githubTokenFormControl.value === ""
    ) {
      return;
    }
    this.ghSvc.setToken(this.githubTokenFormControl.value);
    this.modalService.dismissAll();
  }

  public isTokenValid() {
    return this.githubTokenFormControl.valid;
  }

  public hasToken(): boolean {
    return this.ghSvc.hasToken();
  }
}
