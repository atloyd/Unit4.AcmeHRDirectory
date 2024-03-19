require('dotenv').config();
const pg = require('pg');
const express = require('express');
const app = express();
app.use(express.json());
app.use(require('morgan')('dev'));

const client = new pg.Client(
	process.env.DATABASE_URL || `postgres://localhost/${process.env.DB_NAME}`
);

app.get('/api/departments', async (req, res, next) => {
	try {
		const SQL = `
        SELECT * from departments
        `;
		const response = await client.query(SQL);
		res.send(response.rows);
	} catch (error) {
		next(error);
	}
});

//get

app.get('/api/employees', async (req, res, next) => {
	try {
		const SQL = `
        SELECT * from employees ORDER BY created_at DESC;
        `;
		const response = await client.query(SQL);
		res.send(response.rows);
	} catch (error) {
		next(error);
	}
});

//post

app.post('/api/employees', async (req, res, next) => {
	try {
		const SQL = `
        INSERT INTO employees(name, department_id)
        VALUES($1, $2)
        RETURNING *
        `;
		const response = await client.query(SQL, [
			req.body.name,
			req.body.department_id,
		]);
		res.send(response.rows);
	} catch (error) {
		next(error);
	}
});

//put

app.put('/api/employees/:id', async (req, res, next) => {
	try {
		const SQL = `
        UPDATE employees
        SET name=$1, department_id=$2, updated_at= now()
        WHERE id=$3 RETURNING *
      `;
		const response = await client.query(SQL, [
			req.body.name,
			req.body.department_id,
			req.params.id,
		]);
		res.send(response.rows[0]);
	} catch (error) {
		next(error);
	}
});

//delete

app.delete('/api/employees/:id', async (req, res, next) => {
	try {
		const SQL = `
        DELETE from employees
        WHERE id = $1
      `;
		const response = await client.query(SQL, [req.params.id]);
		res.sendStatus(204);
	} catch (error) {
		next(error);
	}
});

const init = async () => {
	await client.connect();
	console.log('DB Connected');

	let SQL = `
    DROP TABLE IF EXISTS employees;
    DROP TABLE IF EXISTS departments;
    CREATE TABLE departments(
        id SERIAL PRIMARY KEY,
        name VARCHAR(100)
    );

    CREATE TABLE employees(
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        department_id INTEGER REFERENCES departments(id) NOT NULL,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
    );
    `;

	await client.query(SQL);
	console.log('tables created');

	SQL = `
    INSERT INTO departments(name) VALUES('HR');
    INSERT INTO departments(name) VALUES('Accounting');
    INSERT INTO departments(name) VALUES('IT');
    INSERT INTO employees(name, department_id) VALUES('Jon', (SELECT id FROM departments WHERE name='HR'));
    INSERT INTO employees(name, department_id) VALUES('Bob', (SELECT id FROM departments WHERE name='IT'));
    INSERT INTO employees(name, department_id) VALUES('Kim', (SELECT id FROM departments WHERE name='HR'));
    INSERT INTO employees(name, department_id) VALUES('Eric', (SELECT id FROM departments WHERE name='Accounting'));
    INSERT INTO employees(name, department_id) VALUES('Brad', (SELECT id FROM departments WHERE name='Accounting'));
    INSERT INTO employees(name, department_id) VALUES('Austin', (SELECT id FROM departments WHERE name='IT'));
    `;

	await client.query(SQL);
	console.log('tables seeded');

	const port = process.env.PORT || 3000;
	app.listen(port, () => console.log(`Listening on port ${port}`));
};

init();
