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

import {
  Component,
  ElementRef,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from "@angular/core";

import * as Plotly from "plotly.js-dist-min";
import { Subscription } from "rxjs";
import {
  Epics,
  GithubService,
  Issues,
  IssuesByState,
} from "src/app/shared/services/github.service";

@Component({
  selector: "s3gw-radar",
  templateUrl: "./radar.component.html",
  styleUrls: ["./radar.component.scss"],
})
export class RadarComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild("epicsPlot", { static: true })
  public epicsPlotElement!: ElementRef;

  @ViewChild("kindsPlot", { static: true })
  public kindsPlotElement!: ElementRef;

  @ViewChild("areasPlot", { static: true })
  public areasPlotElement!: ElementRef;

  @ViewChild("byStateKindsPlot", { static: true })
  public byStateKindsPlotElement!: ElementRef;
  @ViewChild("byStateAreaPlot", { static: true })
  public byStateAreaPlotElement!: ElementRef;

  private epicsLayout!: Partial<Plotly.Layout>;
  private epicsData: Plotly.Data[] = [];

  private issuesByKindLayout!: Partial<Plotly.Layout>;
  private issuesByKindData: Plotly.Data[] = [];

  private issuesByAreaLayout!: Partial<Plotly.Layout>;
  private issuesByAreaData: Plotly.Data[] = [];

  private stateIssuesByKindLayout!: Partial<Plotly.Layout>;
  private stateIssuesByKindData: Plotly.Data[] = [];

  private stateIssuesByAreaLayout!: Partial<Plotly.Layout>;
  private stateIssuesByAreaData: Plotly.Data[] = [];

  private epicsSubscription?: Subscription;
  private issuesSubscription?: Subscription;
  private issuesByStateSubscription?: Subscription;

  public notEnoughEpics = false;
  public notEnoughKinds = false;
  public notEnoughAreas = false;
  public notEnoughKindsByState = false;
  public notEnoughAreasByState = false;

  public constructor(private ghSvc: GithubService) {}

  public ngOnInit(): void {
    this.epicsSubscription = this.ghSvc.getEpics().subscribe({
      next: (epics: Epics) => {
        this.updateEpics(epics);
      },
    });

    this.issuesSubscription = this.ghSvc.getIssues().subscribe({
      next: (issues: Issues) => {
        this.updateIssues(issues);
      },
    });

    this.issuesByStateSubscription = this.ghSvc.getIssuesByState().subscribe({
      next: (issues: IssuesByState) => {
        this.updateIssuesByState(issues);
      },
    });
  }

  public ngOnDestroy(): void {
    if (!!this.epicsSubscription) {
      this.epicsSubscription.unsubscribe();
    }
    if (!!this.issuesSubscription) {
      this.issuesSubscription.unsubscribe();
    }
    if (!!this.issuesByStateSubscription) {
      this.issuesByStateSubscription.unsubscribe();
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    console.debug("plot changes: ", changes);
  }

  private createEpics(): Promise<Plotly.PlotlyHTMLElement> {
    return Plotly.newPlot(
      this.epicsPlotElement.nativeElement,
      this.epicsData,
      this.epicsLayout,
    );
  }

  private createKinds(): Promise<Plotly.PlotlyHTMLElement> {
    return Plotly.newPlot(
      this.kindsPlotElement.nativeElement,
      this.issuesByKindData,
      this.issuesByKindLayout,
    );
  }

  private createAreas(): Promise<Plotly.PlotlyHTMLElement> {
    return Plotly.newPlot(
      this.areasPlotElement.nativeElement,
      this.issuesByAreaData,
      this.issuesByAreaLayout,
    );
  }

  private createByStateKinds(): Promise<Plotly.PlotlyHTMLElement> {
    return Plotly.newPlot(
      this.byStateKindsPlotElement.nativeElement,
      this.stateIssuesByKindData,
      this.stateIssuesByKindLayout,
    );
  }

  private createByStateAreas(): Promise<Plotly.PlotlyHTMLElement> {
    return Plotly.newPlot(
      this.byStateAreaPlotElement.nativeElement,
      this.stateIssuesByAreaData,
      this.stateIssuesByAreaLayout,
    );
  }

  private updateEpics(epics: Epics) {
    if (epics.epics.length < 3) {
      this.notEnoughEpics = true;
      console.log("not enough data points");
      return;
    }

    const theta = [...epics.epics, epics.epics[0]];
    console.log("theta: ", theta);

    let r: number[] = [];
    let highest: number = 0;
    theta.forEach((name: string) => {
      const n = epics.issuesByEpic[name].length;
      highest = Math.max(highest, n);
      r.push(n);
    });
    console.log("r: ", r);

    this.epicsLayout = {
      polar: {
        radialaxis: {
          visible: true,
          range: [0, highest],
        },
      },
    };
    this.epicsData = [
      {
        type: "scatterpolar",
        r: r,
        theta: theta,
        fill: "toself",
        name: "group A",
      },
    ];

    this.createEpics().then(() => {});
  }

  private updateIssues(issues: Issues) {
    if (issues.kinds.length >= 3) {
      this.updateKinds(issues);
    }
    if (issues.areas.length >= 3) {
      this.updateAreas(issues);
    }
  }

  private updateKinds(issues: Issues) {
    const kinds = [...issues.kinds, issues.kinds[0]];
    let r: number[] = [];
    let highest: number = 0;
    kinds.forEach((name: string) => {
      const n = issues.byKind[name].length;
      highest = Math.max(highest, n);
      r.push(n);
    });

    this.issuesByKindLayout = {
      polar: {
        radialaxis: {
          visible: true,
          range: [0, highest],
        },
      },
    };
    this.issuesByKindData = [
      {
        type: "scatterpolar",
        r: r,
        theta: kinds,
        fill: "toself",
        name: "issue kind",
      },
    ];

    this.createKinds().then(() => {});
  }

  private updateAreas(issues: Issues) {
    const areas = [...issues.areas, issues.areas[0]];
    let r: number[] = [];
    let highest: number = 0;
    areas.forEach((name: string) => {
      const n = issues.byArea[name].length;
      highest = Math.max(highest, n);
      r.push(n);
    });

    this.issuesByAreaLayout = {
      polar: {
        radialaxis: {
          visible: true,
          range: [0, highest],
        },
      },
    };
    this.issuesByAreaData = [
      {
        type: "scatterpolar",
        r: r,
        theta: areas,
        fill: "toself",
        name: "issue kind",
      },
    ];

    this.createAreas().then(() => {});
  }

  private updateIssuesByState(issues: IssuesByState) {
    this.updateByStateKinds(issues);
    this.updateByStateAreas(issues);
  }

  private updateByStateKinds(issues: IssuesByState) {
    const kinds = [...issues.open.kinds];
    issues.closed.kinds.forEach((v: string) => {
      if (kinds.includes(v)) {
        return;
      }
      kinds.push(v);
    });
    if (kinds.length === 0) {
      this.notEnoughKindsByState = true;
      console.log("not enough kinds by state");
      return;
    }
    kinds.push(kinds[0]);

    const open_r: number[] = [];
    const closed_r: number[] = [];
    let highest = 0;
    kinds.forEach((name: string) => {
      let open_n = 0;
      if (name in issues.open.byKind) {
        open_n = issues.open.byKind[name].length;
      }
      let closed_n = 0;
      if (name in issues.closed.byKind) {
        closed_n = issues.closed.byKind[name].length;
      }
      highest = Math.max(highest, open_n, closed_n);
      open_r.push(open_n);
      closed_r.push(closed_n);
    });

    this.stateIssuesByKindLayout = {
      polar: {
        radialaxis: {
          visible: true,
          range: [0, highest],
        },
      },
    };
    this.stateIssuesByKindData = [
      {
        type: "scatterpolar",
        r: open_r,
        theta: kinds,
        fill: "toself",
        name: "open issues",
      },
      {
        type: "scatterpolar",
        r: closed_r,
        theta: kinds,
        fill: "toself",
        name: "closed issues",
      },
    ];

    this.createByStateKinds().then(() => {});
  }

  private updateByStateAreas(issues: IssuesByState) {
    const areas = [...issues.open.areas];
    issues.closed.areas.forEach((v: string) => {
      if (areas.includes(v)) {
        return;
      }
      areas.push(v);
    });
    if (areas.length === 0) {
      this.notEnoughAreasByState = true;
      console.log("not enough areas by state");
      return;
    }
    areas.push(areas[0]);

    const open_r: number[] = [];
    const closed_r: number[] = [];
    let highest = 0;
    areas.forEach((name: string) => {
      let open_n = 0;
      if (name in issues.open.byArea) {
        open_n = issues.open.byArea[name].length;
      }
      let closed_n = 0;
      if (name in issues.closed.byArea) {
        closed_n = issues.closed.byArea[name].length;
      }
      highest = Math.max(highest, open_n, closed_n);
      open_r.push(open_n);
      closed_r.push(closed_n);
    });

    this.stateIssuesByAreaLayout = {
      polar: {
        radialaxis: {
          visible: true,
          range: [0, highest],
        },
      },
    };
    this.stateIssuesByAreaData = [
      {
        type: "scatterpolar",
        r: open_r,
        theta: areas,
        fill: "toself",
        name: "open issues",
      },
      {
        type: "scatterpolar",
        r: closed_r,
        theta: areas,
        fill: "toself",
        name: "closed issues",
      },
    ];

    this.createByStateAreas().then(() => {});
  }
}
