# Cinnamon Flutter project Template

## **Table of Contents**

*  [Info](#info)
*  [Running the app](#running)
*  [Blog post](#blog)
*  [About project](#about)
*  [Project structure overview](#structure)
*  [Database and data structure](#database)
*  [Authentication and authorization](#auth)
*  [Documenting](#docs)
*  [Communication protocols](#protocol)
*  [Conclusion](#conclusion)
----

## **Running the app** <a name="running"></a>

First you need to provide enviromental variables. You copy/paste variable names from **<em>./.env.example</em>** file and provide your variables.

Installation is easy and can be done in seconds! Clone this project, make sure you're on the latest Node.js version, open the newly cloned project and run the following commands:

Install all dependencies:

```bash
npm install
```

Run the app:

```bash
npm run start
```
After you started the app, you can visit to http://localost:3000/api-docs you will find yourself on our API documentation page.

###### ** We are using port 3000, but you can set up your env variables as you like and use any other port.

There you can test our template.

## **About project** <a name="about"></a>

This adapted template is designed to align with the latest trends and best practices in Node.js application development, ensuring that our projects follow the most effective approaches. It will be regularly updated to maintain its relevance and efficacy over time. By fostering a sense of familiarity among our developers, this template aims to enhance collaboration and productivity within our team, ultimately maximizing our effectiveness in delivering high-quality solutions.

## **Project structure overview** <a name="structure"></a>

Given that our codebase is written in TypeScript, we've adopted the "package-by-feature" structure as our preferred method. This approach not only maximizes our utilization of TypeScript's robust features but also facilitates seamless migration to a microservices architecture, should the need arise. By organizing our code in this manner, we enhance readability, maintainability, and scalability, ensuring that our development process remains efficient and adaptable to evolving requirements.

Within the */src* directory, we house the definitions of Express routes, business logic, middleware functions, and configurations for third-party services. This centralized location serves as the core of our application, consolidating essential components such as routing logic, business operations, middleware implementations, and configurations for external services. By organizing these elements within the /src directory, we ensure clarity, maintainability, and ease of access for developers working on the project.

*/api*<br>
*/config*<br>
*/interfaces*<br>
*/logger*<br>
*/middleware*<br>
*/routes*<br>
*/services*<br>

## **Database and data structure** <a name="database"></a>

Our choice of MySQL as the primary database, complemented by the TypeORM ORM, underscores our commitment to reliability and performance. By deliberately simplifying the number of tables within our database schema, we optimize the template for both ease of use and future scalability. This strategic approach not only enhances the template's flexibility but also accelerates development cycles and minimizes potential complexities associated with database management. Additionally, leveraging TypeORM facilitates seamless integration with TypeScript, further enhancing code maintainability and productivity for our development team.

## **Authentication and authorization** <a name="auth"></a>

In our template, we've implemented authentication and authorization using JWT tokens, enhancing the security of our application. The integration of refresh tokens further bolsters our app's security posture, providing an additional layer of protection against unauthorized access. Continuously striving to enhance our security measures, we are dedicated to adopting and implementing new, improved approaches. By remaining vigilant and proactive, we prioritize the ongoing protection of our users' data and the integrity of our systems.

Furthermore, we prioritize the security of sensitive data stored within our database by encrypting it thoroughly. Our encryption protocols are designed to ensure that even our developers cannot decrypt this information, underscoring our commitment to safeguarding user privacy and confidentiality. This stringent approach to encryption reinforces the integrity of our data storage practices, providing peace of mind to both our team and our users.

## **Monitor and logging** <a name="monitor"></a>

While Morgan serves as our primary logging tool for the application, we are continuously enhancing our template to incorporate additional monitoring and event observation tools. This proactive approach allows us to strengthen our application's capabilities by gaining deeper insights into its performance and behavior. By expanding our toolkit to include comprehensive monitoring solutions, we aim to optimize resource utilization, identify potential issues proactively, and enhance overall system reliability. Our commitment to constant improvement underscores our dedication to delivering high-quality, resilient applications that meet the evolving needs of our users.

## **Communication protocols** <a name="protocol"></a>

In our application, we've seamlessly integrated both HTTP and WebSocket protocols to cater to diverse communication needs. Leveraging the versatile Express.js framework, we efficiently manage server operations and HTTP requests, ensuring robustness and scalability. Additionally, for WebSocket communications, we've opted for the native WS module, which provides efficient handling of real-time data exchange, enhancing responsiveness and interactivity within our application. By utilizing these technologies in tandem, we deliver a comprehensive solution capable of meeting various communication requirements while maintaining performance and reliability.

## **Documentation** <a name="docs"></a>

In addition to our database setup, we prioritize comprehensive documentation for our Node.js applications, including the integration of Swagger. Clear and detailed documentation ensures that our codebase is easily understandable and accessible to all team members. By incorporating Swagger, we provide an interactive API documentation platform that facilitates seamless communication between developers, stakeholders, and other project members. Swagger enables us to document endpoints, request/response payloads, and authentication mechanisms, enhancing clarity and consistency across our API implementations. This commitment to documentation, bolstered by Swagger, fosters collaboration, accelerates onboarding processes for new team members, and ultimately contributes to the long-term maintainability and scalability of our applications.

## **Conclusion** <a name="conclusion"></a>

While we have chosen specific tools for implementation, it's essential to highlight that our team remains highly adaptable and flexible to accommodate your unique requirements. Our expertise extends beyond the selected tools, allowing us to seamlessly integrate alternative solutions as needed. With a focus on collaboration and client satisfaction, we prioritize understanding your needs and tailoring our approach to deliver optimal results. Rest assured, our commitment to flexibility ensures that we can effectively adapt to any changes or preferences, ensuring a smooth and successful project collaboration.