// Builder Pattern: Dinamik SQL UPDATE setClause ve parametrelerini
// zincirleme sekilde olusturarak yeni alan eklemeyi kolaylastirir.
class SqlUpdateBuilder {
    constructor() {
        this.fields = [];
        this.values = [];
        this.paramIndex = 1;
    }

    addField(column, value) {
        this.fields.push(`${column} = $${this.paramIndex++}`);
        this.values.push(value);
        return this;
    }

    isEmpty() {
        return this.fields.length === 0;
    }

    build(whereColumn, whereValue) {
        const whereParamIndex = this.paramIndex;
        return {
            setClause: this.fields.join(', '),
            values: [...this.values, whereValue],
            whereParamIndex,
            whereColumn
        };
    }
}

module.exports = SqlUpdateBuilder;
