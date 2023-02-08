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
  OnInit,
  SimpleChanges,
  ViewChild,
} from "@angular/core";

import * as Plotly from "plotly.js-dist-min";

@Component({
  selector: "s3gw-radar",
  templateUrl: "./radar.component.html",
  styleUrls: ["./radar.component.scss"],
})
export class RadarComponent implements OnInit, OnChanges {
  @ViewChild("plot", { static: true })
  public plotElement!: ElementRef;

  private layout!: Partial<Plotly.Layout>;
  private data: Plotly.Data[] = [];

  public constructor() {}

  public ngOnInit(): void {
    this.layout = {
      polar: {
        radialaxis: {
          visible: true,
          range: [0, 50],
        },
      },
    };
    this.data = [
      {
        type: "scatterpolar",
        r: [39, 28, 8, 7, 28, 39],
        theta: ["A", "B", "C", "D", "E", "A"],
        fill: "toself",
        name: "group A",
      },
    ];

    this.create().then(() => {});
  }

  public ngOnChanges(changes: SimpleChanges): void {
    console.debug("plot changes: ", changes);
  }

  private create(): Promise<Plotly.PlotlyHTMLElement> {
    return Plotly.newPlot(
      this.plotElement.nativeElement,
      this.data,
      this.layout,
    );
  }
}
