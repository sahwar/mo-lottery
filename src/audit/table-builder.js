function AuditTableBuilder(game) {
    var weeksPerYear = 52;
    
    this.game = game;
    this.numbers = game.get('numbers');
    this.drawSize = game.get('drawSize');
    this.drawsPerWeek = game.get('drawsPerWeek');
    this.draws = game.getAllDraws();
    
    // use 6 months for now
    this.iterations = (weeksPerYear * this.drawsPerWeek) / 2;
}

AuditTableBuilder.prototype = {
    constructor: AuditTableBuilder,
    
    get: function () {
        var table = new AuditTable('Audit'), iterator;
        
        // add labels
        this.addAuditDataLabels(table);
        
        // add elapse time trend data
        for (iterator = 150; iterator <= 250; iterator++) {
            this.addAuditDataRow(table, this.getAuditData('ElapseTimeTrend', 1, iterator,
                this.getSuggestionsConfig({
                    drawsPerPeriod: iterator
                }, {})
            ));
            this.addAuditDataRow(table, this.getAuditData('ElapseTimeTrendGaps', 1, iterator,
                this.getSuggestionsConfig({
                    drawsPerPeriod: iterator
                }, {})
            ));
        }
    
        // add hot-cold trend data
        for (iterator = 5; iterator <= 20; iterator++) {
            this.addAuditDataRow(table, this.getAuditData('HotColdTrend', 12, iterator,
                this.getSuggestionsConfig({}, {
                    periodCount: 12,
                    drawsPerPeriod: iterator
                })
            ));
        }
        
        // sort data by score
        table.sort(5 + this.drawSize);
        
        return table;
    },
    
    getAuditData: function (algorithm, periodCount, drawsPerPeriod, suggestionsConfig) {
        var currentIteration = 1, lastDraw, suggestion, auditData;
        
        auditData = new AuditData(this.drawSize, algorithm, periodCount, drawsPerPeriod);
        while (currentIteration <= this.iterations) {
            lastDraw = this.draws[this.draws.length - currentIteration];
            suggestion = new AnalyserSuggestions(
                this.numbers,
                this.draws.slice(0, currentIteration * -1),
                this.drawSize,
                suggestionsConfig
            )['get' + algorithm]();

            // update audit data
            auditData.check(suggestion, lastDraw);

            // increase iteration counters
            currentIteration++;
        }
        auditData.calculateScore();

        return auditData;
    },
    
    addAuditDataLabels: function (table) {
        var numberCount = 0;
        
        table.addLabel('Algorithm');
        table.addLabel('Period count');
        table.addLabel('Draws per period');
        
        while (numberCount <= this.drawSize) {
            table.addLabel('Hit ' + numberCount);
            numberCount++;
        }
        
        table.addLabel('Score');
        table.addLabel('Total hits');
        table.addLabel('Total hit %');
    },
    
    addAuditDataRow: function (table, auditData) {
        table.addData(auditData.getAlgorithm());
        table.addData(auditData.getPeriodCount());
        table.addData(auditData.getDrawsPerPeriod());
        
        _.each(auditData.getNumbersHit(), function (hits, numberCount) {
            table.addData(hits);
        });
        
        table.addData(auditData.getScore());
        table.addData(auditData.getTotalHitCount());
        table.addData(auditData.getTotalHitPercentage());
        
        table.endRow();
    },
    
    getSuggestionsConfig: function (elapseTimeTrend, hotColdTrend) {
        return {
            elapseTimeTrend: _.extend({
                drawsPerPeriod: 1
            }, elapseTimeTrend),
            hotColdTrend: _.extend({
                periodCount: 1,
                drawsPerPeriod: 1
            }, hotColdTrend)
        };
    }
}