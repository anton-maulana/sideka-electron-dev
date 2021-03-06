import { remote } from 'electron';
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from "@angular/core";
import { BaseHotComponent } from './base';

import schemas from '../../schemas';
import DataApiService from '../../stores/dataApiService';

import * as base64 from 'uuid-base64';
import * as uuid from 'uuid';

@Component({
    selector: 'pbdtRt-hot',
    template: ''
})
export class PbdtRtHotComponent extends BaseHotComponent implements OnInit, OnDestroy {
    private _sheet;
    private _schema;
    private _mode;

    @Input()
    set sheet(value) {
        this._sheet = value;
    }
    get sheet() {
        return this._sheet;
    }

    @Input()
    set schema(value) {
        this._schema = value;
    }
    get schema() {
        return this._schema;
    }

    @Input()
    set mode(value) {
        this._mode = value;
    }
    get mode() {
        return this._mode;
    }

    constructor(_dataService: DataApiService) {
        super();
    }

    ngOnInit(): void {
        let schema = this.schema;
        let element = $('.' + this.sheet + '-sheet')[0];

        if (!element || !schema)
            return;

        let options = {
            data: [],
            topOverlay: 34,
            rowHeaders: true,
            colHeaders: schemas.getHeader(schema),
            columns: schemas.getColumns(schema),
            colWidths: schemas.getColWidths(schema),
            rowHeights: 23,
            columnSorting: true,
            sortIndicator: true,
            hiddenColumns: { columns: [0], indicators: true },
            renderAllRows: false,
            outsideClickDeselects: false,
            autoColumnSize: false,
            search: true,
            schemaFilters: true,
            readOnly: this._mode === 'view' ? true : false,
            contextMenu: ['undo', 'redo', 'row_above', 'remove_row'],
            dropdownMenu: ['filter_by_condition', 'filter_action_bar']
        };

        this.createHot(element, options)
    }

    initialize(): void {
        let schema = this.schema;
        let element = $('.' + this.sheet + '-sheet')[0];

        if (!element || !schema)
            return;

        let options = {
            data: [],
            topOverlay: 34,
            rowHeaders: true,
            colHeaders: schemas.getHeader(schema),
            columns: schemas.getColumns(schema),
            colWidths: schemas.getColWidths(schema),
            rowHeights: 23,
            columnSorting: true,
            sortIndicator: true,
            hiddenColumns: { columns: [0], indicators: true },
            renderAllRows: false,
            outsideClickDeselects: false,
            autoColumnSize: false,
            search: true,
            schemaFilters: true,
            contextMenu: ['undo', 'redo', 'row_above', 'remove_row'],
            dropdownMenu: ['filter_by_condition', 'filter_action_bar']
        };

        this.createHot(element, options);
    }

    ngOnDestroy(): void {
      
    }
}